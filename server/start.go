package server

import (
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"sync"
	"sync/atomic"
	"time"

	"firebase.google.com/go/messaging"
	"github.com/datagrove/mangrove/oauth"
	"github.com/gorilla/mux"
	"github.com/lesismal/llib/std/crypto/tls"
	"github.com/lesismal/nbio/nbhttp"
	"github.com/lesismal/nbio/nbhttp/websocket"
	"github.com/markbates/goth"

	"github.com/fxamacker/cbor/v2"
	"github.com/rs/cors"
)

// for embedded use we want to make it easy to start a websocket server that we can then leverage for various apis supporting the ui library
// we need to be able mount the server on a subpath

func sockUnmarshal(data []byte, v interface{}) error {
	return cbor.Unmarshal(data, v)
}
func sockMarshall(v interface{}) ([]byte, error) {
	return cbor.Marshal(v)
}

// a job server needs a list of jobs, not unlike cobra commands, but typically all the parameters need to be resolved since its going off a clock.

// It can also use launch to add api's, but it's not clear that this is useful given that UI won't know anything about them.

// we might want to allow a job to control a frame of the ui, but how?
// maybe we should have a list of functions that take a bit of json to configure themselves.

func (s *Server) RemoveSession(sess *Session) {
	for h := range sess.Handle {
		s.Close(sess, h)
	}

	s.muSession.Lock()
	defer s.muSession.Unlock()
	delete(s.Session, sess.Secret)
}

func (s *Server) NextHandle() int64 {
	return atomic.AddInt64(&s.Handle, 1)
}

func (s *Server) AddTemplates(fs embed.FS) {

}

type Socket struct {
	// session is separate here because it might be needed in a http handler
	*Session
	conn *websocket.Conn
	Svr  *Server
}

var _ SessionNotifier = (*Socket)(nil)

func (s *Socket) Notify(handle int64, data interface{}) {
	var j struct {
		Handle int64       `json:"handle,omitempty"`
		Data   interface{} `json:"data,omitempty"`
	}
	j.Handle = handle
	j.Data = data
	b, e := sockMarshall(&j)
	if e != nil {
		log.Print(e)
	}
	e = s.conn.WriteMessage(websocket.BinaryMessage, b)
	if e != nil {
		log.Print(e)
	}
}

func (s *Server) AddApi(name string, login bool, f Rpcf) {
	fx := func(p *Rpcp) (interface{}, error) {
		if p.Session.Oid == -1 && login {
			return nil, errors.New("notLoggedIn")
		}
		return f(p)
	}
	s.Api[name] = fx
}
func (s *Server) AddApij(name string, login bool, f Rpcfj) {
	fx := func(p *Rpcpj) (interface{}, error) {
		if p.Session.Oid == -1 && login {
			return nil, errors.New("notLoggedIn")
		}
		return f(p)
	}
	s.Apij[name] = fx
}

type Rpcj struct {
	Method string          `json:"method"`
	Params json.RawMessage `json:"params"`
	Id     int64           `json:"id"`
}
type Rpc struct {
	Method string          `json:"method"`
	Params cbor.RawMessage `json:"params"`
	Id     int64           `json:"id"`
}
type Rpcp struct {
	Rpc
	*Session
}
type Rpcpj struct {
	Rpcj
	*Session
}

func (s *Server) GetSession(id string) (*Session, bool) {
	s.muSession.Lock()
	defer s.muSession.Unlock()
	r, ok := s.Session[id]
	return r, ok
}

func (s *Server) NewSession(notifier SessionNotifier) (*Session, error) {
	secret, e := GenerateRandomString(32)
	if e != nil {
		return nil, e
	}
	s.muSession.Lock()
	defer s.muSession.Unlock()

	r := &Session{
		Oid:               -1,
		PasskeyCredential: PasskeyCredential{},
		Device:            "",
		Secret:            secret,
		data:              nil,
		mu:                sync.Mutex{},
		Handle:            map[int64]StreamHandle{},
		Notifier:          notifier,
	}
	s.Session[secret] = r
	return r, nil
}

func (s *Server) LinkDevice(sess *Session) error {
	return nil
}

// func (s *Server) AddCredential(sess *Session,) (*User, error) {

// 	// check the ucan
// 	ucan, e := ucan.DecodeUcan(ucanLink)
// 	_ = ucan
// 	if e != nil {
// 		return nil, e
// 	}

// 	return nil, nil
// }

// we defer creating new users until we have a credential
// what if this fails? recover by regenerating a uid? force a signature?
// maybe before we get here we have already established that we must be the user?
//
//	func (s *Server) NewUser(sess *Session, cred *webauthn.Credential) error {
//		// convert the did to not use ':'
//		s.SaveUser(&sess.User)
//	}

type spaFileSystem struct {
	root http.FileSystem
}

func (fs *spaFileSystem) Open(name string) (http.File, error) {
	f, err := fs.root.Open(name)
	if os.IsNotExist(err) {
		log.Printf("not found %s", name)
		return fs.root.Open("index.html")
	}
	return f, err
}

// directory should already be initalized
// maybe the caller should pass a launch function?
func NewServer(optc *Config) (*Server, error) {

	var staticFS = fs.FS(optc.Ui)
	// ui/dist should be in config?
	htmlContent, err := fs.Sub(staticFS, "ui/dist")
	if err != nil {
		return nil, err
	}
	fs := http.FileServer(&spaFileSystem{http.FS(htmlContent)})

	mmux := mux.NewRouter()
	done := func(w http.ResponseWriter, r *http.Request, user goth.User) {
		// here we have to do our fake login and set the cookies.
		// we have to try to get the password from our database.
		// pass, e := s.GetPasswordFromEmail(user.Email)
		// if e != nil {
		// 	// !!todo this email address has not been registered, we need to allow them to enter their password first
		// 	// we should prepopulate their email address and store their choice of social login. Put these in local storage?
		// 	http.Redirect(w, r, prefix+"/en/login", http.StatusFound)
		// }
		// u, e := proxyLogin(user.Email, pass)
		// if e != nil {
		// 	log.Printf("failed to login %s", e.Error())
		// 	return
		// }
		// // this should be simpler, post the email and password to the login and be done with it?
		// for _, c := range u.Cookies {
		// 	if strings.HasPrefix(c, "login=") {
		// 		w.Header().Add("Set-Cookie", c+"; Path=/; ")
		// 		log.Printf("cookie %s", c)
		// 	}
		// }
		http.Redirect(w, r, "/home", http.StatusFound)
	}
	oauth.AddHandlers(mmux, "http://localhost:3000", "/datagrove", done)

	var tlsConfig *tls.Config
	if len(optc.AddrsTLS) > 0 {
		rsaCertPEM, err := os.ReadFile(optc.HttpsCert)
		rsaKeyPEM, err2 := os.ReadFile(optc.HttpsPrivate)
		if err != nil || err2 != nil {
			return nil, fmt.Errorf("could not read cert or key: %v %v", err, err2)
		}
		certx, err := tls.X509KeyPair((rsaCertPEM), (rsaKeyPEM))
		if err != nil {
			log.Fatalf("tls.X509KeyPair failed: %v", err)
		}
		tlsConfig = &tls.Config{
			Certificates:       []tls.Certificate{certx},
			InsecureSkipVerify: true,
		}
	}

	handler := cors.Default().Handler(mmux)
	ws := nbhttp.NewServer(nbhttp.Config{
		Network: "tcp",
		// either can be empty
		Addrs:     optc.Addrs,
		AddrsTLS:  optc.AddrsTLS,
		TLSConfig: tlsConfig,
		Handler:   handler,
	})
	db, e := NewDb("postgres://mangrove:mangrove@localhost:5432/mangrove")
	if e != nil {
		return nil, e
	}
	svr := &Server{
		Config: optc,
		Db:     db,
		fcm: &FcmBuffer{
			fcmClient:        &messaging.Client{},
			dispatchInterval: 0,
			batchCh:          make(chan *messaging.Message),
			wg:               sync.WaitGroup{},
		},
		Mux:          mmux,
		Home:         "",
		Ws:           ws,
		Cert:         "",
		Key:          "",
		Api:          map[string]Rpcf{},
		Apij:         map[string]func(a *Rpcpj) (any, error){},
		muSession:    sync.Mutex{},
		Session:      map[string]*Session{},
		Handle:       0,
		muStream:     sync.Mutex{},
		Stream:       map[int64]*Stream{},
		EmbedHandler: fs,
		WsHandler: func(http.ResponseWriter, *http.Request) {
		},
		UserSecret: UserSecret{mu: sync.Mutex{}, Users: map[int64]string{}, Secret: map[string]int64{}},
	}

	WebauthnSocket(svr)
	SettingsApi(svr)
	svr.WsHandler = svr.onWebSocket()
	// return unstarted to allow the application to modify the server
	return svr, nil
}

func (svr *Server) onWebSocket() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sock := &Socket{
			Svr:     svr,
			Session: nil,
		}
		sv, e := svr.NewSession(sock)
		if e != nil {
			return
		}
		sock.Session = sv

		u := websocket.NewUpgrader()
		u.CheckOrigin = func(r *http.Request) bool { return true }
		u.OnMessage(func(c *websocket.Conn, messageType websocket.MessageType, data []byte) {

			if messageType != websocket.BinaryMessage {
				var rpc Rpcpj
				rpc.Session = sock.Session
				json.Unmarshal(data, &rpc.Rpcj)
				r, ok := sock.Svr.Apij[rpc.Method]
				if !ok {
					log.Printf("bad method %s", rpc.Method)
					return
				}
				rx, err := r(&rpc)
				if err != nil {
					var o struct {
						Id    int64  `json:"id"`
						Error string `json:"error"`
					}
					o.Id = rpc.Id
					o.Error = err.Error()
					b, _ := json.Marshal(&o)
					sock.conn.WriteMessage(websocket.TextMessage, b)
				} else {
					var o struct {
						Id     int64       `json:"id"`
						Result interface{} `json:"result"`
					}
					o.Id = rpc.Id
					o.Result = rx
					b, _ := json.Marshal(&o)
					log.Printf("sending %s", string(b))
					sock.conn.WriteMessage(websocket.TextMessage, b)
				}
			} else {
				var rpc Rpcp
				rpc.Session = sock.Session
				sockUnmarshal(data, &rpc.Rpc)
				r, ok := sock.Svr.Api[rpc.Method]
				if !ok {
					log.Printf("bad method %s", rpc.Method)
					return
				}
				rx, err := r(&rpc)
				if err != nil {
					var o struct {
						Id    int64  `json:"id"`
						Error string `json:"error"`
					}
					o.Id = rpc.Id
					o.Error = err.Error()
					b, _ := sockMarshall(&o)
					sock.conn.WriteMessage(websocket.BinaryMessage, b)
				} else {
					var o struct {
						Id     int64       `json:"id"`
						Result interface{} `json:"result"`
					}
					o.Id = rpc.Id
					o.Result = rx
					bs, _ := json.MarshalIndent(o, "", "  ")
					log.Printf("sending %s", string(bs))
					b, _ := sockMarshall(&o)
					sock.conn.WriteMessage(websocket.BinaryMessage, b)
				}
			}
			sock.conn.SetReadDeadline(time.Now().Add(nbhttp.DefaultKeepaliveTime))
		})
		u.OnClose(func(c *websocket.Conn, err error) {

		})
		// time.Sleep(time.Second * 5)
		conn, err := u.Upgrade(w, r, nil)
		if err != nil {
			log.Print(err)
			return
		}
		sock.conn = conn.(*websocket.Conn)
		conn.SetReadDeadline(time.Now().Add(nbhttp.DefaultKeepaliveTime))
		// we can write
	}
}
