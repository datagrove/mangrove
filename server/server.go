package server

import (
	"embed"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"

	"github.com/gliderlabs/ssh"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/gorilla/mux"
	"github.com/kardianos/service"
	"github.com/lesismal/nbio/nbhttp"
	"github.com/skip2/go-qrcode"
)

var logger service.Logger

type Rpcfj = func(a *Rpcpj) (any, error)
type Rpcf = func(a *Rpcp) (any, error)

type Server struct {
	*Config
	*Db
	fcm *FcmBuffer
	//*FileWatcher
	Mux  *mux.Router //*http.ServeMux
	Home string
	Ws   *nbhttp.Server
	Cert string
	Key  string
	//Logdb     logdb.Database
	Api       map[string]Rpcf
	Apij      map[string]Rpcfj
	muSession sync.Mutex
	Session   map[string]*Session

	Handle int64

	muStream sync.Mutex
	Stream   map[int64]*Stream

	// we need some kind of plugin structure
	EmbedHandler http.Handler
	WsHandler    http.HandlerFunc
	UserSecret
}

type UserSecret struct {
	mu     sync.Mutex
	Users  map[int64]string
	Secret map[string]int64
}

func (s *UserSecret) UserToSecret(user int64) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if secret, ok := s.Users[user]; ok {
		return secret, nil
	}
	secret, e := GenerateRandomString(32)
	if e != nil {
		return "", e
	}
	s.Users[user] = secret
	s.Secret[secret] = user
	return secret, nil
}
func (s *UserSecret) SecretToUser(secret string) int64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	if user, ok := s.Secret[secret]; ok {
		return user
	}
	return -1
}

// move to mangrove

// get what's know about user,password

// we want a

// override defaults with index.jsonc
type ConfigJson struct {
	AddrsTLS []string
	Addrs    []string
	Root     string

	// ProxyTo string
	// Embed   string

	EmailSource string

	Key   string `json:"key,omitempty"`
	Https string `json:"https,omitempty"`
	Sftp  string `json:"sftp,omitempty"`

	HttpsCert     string           `json:"https_cert,omitempty"`
	HttpsPrivate  string           `json:"https_private,omitempty"`
	PasskeyConfig *webauthn.Config `json:"passkey_config,omitempty"`
}
type Config struct {
	ConfigJson
	service.Config
	Ui     embed.FS
	Launch func(*Server) error

	// turn a user name into a cookie. auth could be a password or a token
	ProxyLogin func(user string, auth string) (*ProxyLogin, error)
	// replace a user password
	ProxyUpdatePassword func(user string, password string, auth string) (*ProxyLogin, error)
	// register a new user - should this just go to their page though?
	// we could intercept the post back, then get the password from that.
	// we could do this with the normal signin in page, but the problem is the special username field and extra javascript.
	//ProxyRegister func(key, val []string, auth string) (*ProxyLogin, error)

	//Store   string   `json:"test_root,omitempty"`
	Start func(s *Server) error
}

// should be in challenge info as well?
type LoginInfo struct {
	Home string `json:"home"`
	// email and phone would be nice to get from proxy? what would we do with it?
	// the browser likely already knows the phone.
	Email      string   `json:"email"`
	Phone      string   `json:"phone"`
	Cookies    []string `json:"cookies"` // key,value pairs.
	UserSecret string   `json:"user_secret"`
	// this needs to tell the user what second factors they have defined.
	Options         int64 `json:"options"`
	ActivatePasskey bool  `json:"activate_passkey"`
	ActivateTotp    bool  `json:"activate_totp"`
}

type Settings struct {
	UserSecret string       `json:"user_secret"` // user_secret: string
	Img        []byte       `json:"img"`         // img: Uint8Array | undefined
	Credential []Credential `json:"credential"`  // credential: Credential | undefined
	// Email           string `json:"email"`
	// Phone           string `json:"phone"`
	// ActivatePasskey bool   `json:"activate_passkey"`
	// ActivateTotp    bool   `json:"activate_totp"`
}

type ProxyLogin = LoginInfo

// challenge type can be "optional" or "required" to indicate that the user may or should add a key
type ChallengeNotify struct {
	ChallengeType   int    `json:"challenge_type,omitempty"`
	ChallengeSentTo string `json:"challenge_sent_to,omitempty"`
	OtherOptions    int    `json:"other_options,omitempty"`
	// this is filled for 0 and kNone
	LoginInfo *LoginInfo `json:"login_info,omitempty"`
}

// only the ChallengeNotify structure is sent (not secret). Note that loginInfo is sometimes secret (not logged in yet), sometimes not
type ChallengeInfo struct {
	// either login or challenge info
	LoginInfo       *LoginInfo `json:"login_info,omitempty"`
	ChallengeNotify `json:"challenge_notify,omitempty"`
	Challenge       string `json:"challenge,omitempty"`
}

func (sx *Server) Run() error {
	e := sx.Ws.Start()
	if e != nil {
		return e
	}
	defer sx.Ws.Stop()

	go func() {
		ssh_server := ssh.Server{
			Addr: sx.Config.Sftp,
			PublicKeyHandler: func(ctx ssh.Context, key ssh.PublicKey) bool {
				return true
			},
			SubsystemHandlers: map[string]ssh.SubsystemHandler{
				"sftp": SftpHandlerx,
			},
		}
		kf := ssh.HostKeyFile(sx.Config.Key)
		kf(&ssh_server)
		log.Fatal(ssh_server.ListenAndServe())
	}()
	//go log.Fatal(http.ListenAndServe(x, sx.Mux))
	//log.Fatal(http.ListenAndServeTLS(sx.Https, sx.Cert, sx.Key, sx.Mux))
	//certmagic.HTTPS([]string{"example.com"}, mux)
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)
	<-interrupt
	log.Println("exit")
	return nil
}

// start2 called from service run. start2 because start is a service method
func (s *Server) Start2() {
	if s.Config.Start != nil {
		log.Fatal(s.Config.Start(s))
	} else {
		s.Mux.NotFoundHandler = s.EmbedHandler
		s.Mux.Handle("/", s.EmbedHandler)
		s.Mux.HandleFunc("/wss", s.WsHandler)
		// generate a QR from a url
		s.Mux.HandleFunc("/api/qr/", func(w http.ResponseWriter, r *http.Request) {
			data := r.URL.Path[8:]
			qr, e := qrcode.New(string(data), qrcode.Medium)
			if e != nil {
				return
			}
			w.Header().Set("Content-Type", "image/png")
			w.WriteHeader(200)
			qr.Write(256, w)
		})

		go s.Run()
		if false {
			log.Printf("listening on %s", s.Addrs[0])
			log.Fatal(http.ListenAndServe(s.Addrs[0], s.Mux))
		}
	}
}
