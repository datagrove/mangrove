package server

import (
	"embed"
	"log"
	"net/http"
	"os"
	"os/signal"

	"github.com/gliderlabs/ssh"
	"github.com/kardianos/service"
)

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

	HttpsCert    string `json:"https_cert,omitempty"`
	HttpsPrivate string `json:"https_private,omitempty"`
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

type LoginInfo struct {
	Home    string   `json:"home,omitempty"`
	Email   string   `json:"email,omitempty"`
	Phone   string   `json:"phone,omitempty"`
	Cookies []string `json:"cookies,omitempty"` // key,value pairs.
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
		http.Handle("/", s.EmbedHandler)
		http.HandleFunc("/wss", s.WsHandler)

		s.Run()
		log.Fatal(http.ListenAndServe(":8080", nil))
	}
}
