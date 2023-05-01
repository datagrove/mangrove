package mangrove

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"embed"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"math/big"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gliderlabs/ssh"
	"github.com/google/uuid"
	"github.com/kardianos/service"
	"github.com/lesismal/llib/std/crypto/tls"
	"github.com/lesismal/nbio/nbhttp"
	"github.com/lesismal/nbio/nbhttp/websocket"
	"github.com/pkg/sftp"
	"github.com/rs/zerolog"
	qrcode "github.com/skip2/go-qrcode"
	"github.com/tailscale/hujson"

	"github.com/fsnotify/fsnotify"
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
type Job struct {
	Name   string
	Schema string
	Run    func(*Context, string) error
}

var logger service.Logger

type program struct {
}

func (p *program) Start(s service.Service) error {
	// Start should not block. Do the actual work async.
	go p.run()
	return nil
}
func (p *program) run() {
	// Do work here
}
func (p *program) Stop(s service.Service) error {
	// Stop should not block. Return with a few seconds.
	return nil
}

type Config struct {
	Key   string `json:"key,omitempty"`
	Https string `json:"https,omitempty"`
	Sftp  string `json:"sftp,omitempty"`
	//Store   string   `json:"test_root,omitempty"`
	Ui      embed.FS
	Service service.Config
}
type Container struct {
	Gpg        string                    `json:"gpg,omitempty"`
	Connection map[string]*SshConnection `json:"connection,omitempty"`
}

type Rpcfj = func(a *Rpcpj) (any, error)
type Rpcf = func(a *Rpcp) (any, error)
type Server struct {
	*MangroveServer
	*Db
	*FileWatcher
	*Config
	Mux  *http.ServeMux
	Home string
	Ws   *nbhttp.Server
	Cert string
	Key  string

	Api       map[string]Rpcf
	Apij      map[string]Rpcfj
	muSession sync.Mutex
	Session   map[string]*Session

	Job    map[string]*Job
	Handle int64

	muStream sync.Mutex
	Stream   map[int64]*Stream

	Runtime map[string]Runtime
}

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

func (s *Server) AddJob(job *Job) {
	s.Job[job.Name] = job
}
func (s *Server) AddTemplates(fs embed.FS) {

}
func (s *Server) AddScript(path string, fn func(*Context, string) error) {
	s.Runtime[path] = fn
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
		if p.Session.UserDevice.ID == "" {
			return nil, errors.New("not logged in")
		}
		return f(p)
	}
	s.Api[name] = fx
}
func (s *Server) AddApij(name string, login bool, f Rpcfj) {
	fx := func(p *Rpcpj) (interface{}, error) {
		if p.Session.UserDevice.ID == "" && login {
			return nil, errors.New("not logged in")
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
		UserDevice: UserDevice{},
		Device:     "",
		Secret:     secret,
		data:       nil,
		mu:         sync.Mutex{},
		Handle:     map[int64]StreamHandle{},
		Notifier:   notifier,
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
func (s *Server) NewUser(u *UserDevice) error {
	name := strings.ReplaceAll(u.ID, ":", "_")
	d := path.Join(s.Home, "user", name)
	os.Mkdir(d, 0700)
	a := Asset
	fs.WalkDir(a, "pkg/~", func(p string, de fs.DirEntry, e error) error {
		f, e := fs.ReadFile(a, p)
		if e != nil {
			return e
		}
		os.WriteFile(path.Join(d, p), f, 0600)
		return nil
	})
	return nil
}

type Context struct {
	Config    *Config
	Container *Container
	Store     string
	Artifacts string
	// each task can have its own log (since logs are sequential and tasks can be parallel)
	NextTask int64
}
type Task struct {
	c         *Context
	Artifacts string
	Log       zerolog.Logger
}

func (c *Context) TaskLog() *Task {
	n := atomic.AddInt64(&c.NextTask, 1)
	a := path.Join(c.Artifacts, fmt.Sprintf("%d", n))
	h, e := os.Create(path.Join(c.Artifacts, fmt.Sprintf("log%d.jsonl", n)))
	if e != nil {
		// we can't continue if we can't create a log file
		log.Fatal(e)
	}
	r := &Task{
		c: c,
		// files from this task
		Artifacts: a,
		Log:       zerolog.New(h),
	}
	return r
}
func NewContext(home string, container string) (*Context, error) {
	config, e := LoadConfig(home)
	if e != nil {
		return nil, e
	}
	ct, e := LoadContainer(container)
	if e != nil {
		return nil, e
	}
	artifacts := path.Join(container, "log", uuid.NewString())
	os.MkdirAll(artifacts, 0700)

	return &Context{
		Config:    config,
		Artifacts: artifacts,
		Store:     container,
		Container: ct,
	}, nil
}

// the idea here is to add a few different commands for standalone bespoke servers
//	should this return a cobra command?
// maybe there should be a default proxy server as well

func Unmarshal(b []byte, v interface{}) error {
	ast, err := hujson.Parse(b)
	if err != nil {
		return err
	}
	ast.Standardize()
	return json.Unmarshal(ast.Pack(), v)
}

func LoadContainer(dir string) (*Container, error) {
	var j Container
	b, e := os.ReadFile(path.Join(dir, "index.jsonc"))
	if e != nil {
		return nil, e
	}
	e = Unmarshal(b, &j)
	if e != nil {
		return nil, e
	}
	j.Gpg = path.Join(dir, j.Gpg)
	// resolve the files relative to the container
	for _, v := range j.Connection {
		v.Gpg = path.Join(dir, v.Gpg)
	}

	return &j, nil
}

func LoadConfig(dir string) (*Config, error) {
	var j Config

	b, e := os.ReadFile(path.Join(dir, "index.jsonc"))
	if e != nil {
		return nil, e
	}
	Unmarshal(b, &j)
	if len(j.Key) == 0 {
		h, _ := os.UserHomeDir()
		j.Key = path.Join(h, ".ssh", "id_rsa")
	}
	return &j, nil
}
func initialize(dir string) {
	os.MkdirAll(dir, 0777) // permissions here are not correct, should be lower
	os.WriteFile(path.Join(dir, "index.jsonc"), []byte(`{
		"Https": ":5078",
		"Sftp": ":5079",
	}`), 0777)
}

type spaFileSystem struct {
	root http.FileSystem
}

func (fs *spaFileSystem) Open(name string) (http.File, error) {
	f, err := fs.root.Open(name)
	if os.IsNotExist(err) {
		return fs.root.Open("index.html")
	}
	return f, err
}

// directory should already be initalized
// maybe the caller should pass a launch function?
func NewServer(opt *MangroveServer) (*Server, error) {
	var j Config
	{
		// the user creating the server should become the owner of the server
		h, _ := os.UserHomeDir()
		j.Key = path.Join(h, ".ssh", "id_rsa")
	}
	dir := opt.Root

	cf := path.Join(dir, "index.jsonc")
	_, e := os.Stat(cf)
	if e != nil {
		initialize(dir)
	}
	b, e := os.ReadFile(cf)
	if e != nil {
		log.Fatal(e)
	}
	Unmarshal(b, &j)
	log.Print(string(b))
	j.Ui = opt.Res
	j.Service = service.Config{
		Name:        opt.Name,
		DisplayName: opt.Name,
		Description: opt.Name,
		Arguments:   []string{"start"},
	}

	optc := &j
	if e != nil {
		log.Fatal(e)
	}

	var staticFS = fs.FS(optc.Ui)
	// should this be in config?
	htmlContent, err := fs.Sub(staticFS, "ui/dist")
	if err != nil {
		return nil, err
	}
	fs := http.FileServer(&spaFileSystem{http.FS(htmlContent)})
	mux := http.NewServeMux()
	mux.Handle("/", fs)

	cert := path.Join(dir, "cert.pem")
	key := path.Join(dir, "key.pem")
	_, e = os.Stat(cert)
	if e != nil {
		// generate a self signed cert
		name, _ := os.Hostname()
		// generate a self signed cert
		// https://golang.org/pkg/crypto/tls/#example_GenerateCert
		privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
		if err != nil {
			panic(err)
		}

		// define the certificate template
		template := x509.Certificate{
			SerialNumber: big.NewInt(1),
			Subject: pkix.Name{
				CommonName: name,
			},
			NotBefore:             time.Now(),
			NotAfter:              time.Now().Add(365 * 24 * time.Hour),
			BasicConstraintsValid: true,
			IsCA:                  true,
			KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageDigitalSignature,
			ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth, x509.ExtKeyUsageClientAuth},
			DNSNames:              []string{name, "localhost"},
			IPAddresses:           []net.IP{net.IPv4(127, 0, 0, 1)},
		}

		// create a self-signed certificate using the private key and template
		derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &privateKey.PublicKey, privateKey)
		if err != nil {
			panic(err)
		}

		// write the private key to a PEM file
		privateKeyFile, err := os.Create(key)
		if err != nil {
			panic(err)
		}
		defer privateKeyFile.Close()
		privateKeyPEM := &pem.Block{
			Type:  "RSA PRIVATE KEY",
			Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
		}
		err = pem.Encode(privateKeyFile, privateKeyPEM)
		if err != nil {
			panic(err)
		}

		// write the certificate to a PEM file
		certFile, err := os.Create(cert)
		if err != nil {
			panic(err)
		}
		defer certFile.Close()
		certPEM := &pem.Block{
			Type:  "CERTIFICATE",
			Bytes: derBytes,
		}
		err = pem.Encode(certFile, certPEM)
		if err != nil {
			panic(err)
		}
	}
	rsaCertPEM, err := os.ReadFile(cert)
	if err != nil {
		return nil, err
	}
	rsaKeyPEM, err := os.ReadFile(key)
	if err != nil {
		return nil, err
	}

	certx, err := tls.X509KeyPair((rsaCertPEM), (rsaKeyPEM))
	if err != nil {
		log.Fatalf("tls.X509KeyPair failed: %v", err)
	}
	tlsConfig := &tls.Config{
		Certificates:       []tls.Certificate{certx},
		InsecureSkipVerify: true,
	}
	_ = tlsConfig
	handler := cors.Default().Handler(mux)
	ws := nbhttp.NewServer(nbhttp.Config{
		Network: "tcp",
		// either can be empty
		Addrs:     opt.Addrs,
		AddrsTLS:  opt.AddrsTLS,
		TLSConfig: tlsConfig,
		Handler:   handler,
	})
	db, e := NewDb("postgres://mangrove:mangrove@localhost:5432/mangrove")
	if e != nil {
		return nil, e
	}
	svr := &Server{
		MangroveServer: opt,
		Db:             db,
		Config:         optc,
		Mux:            mux,
		Home:           dir,
		Ws:             ws,
		Cert:           cert,
		Key:            key,
		Api:            map[string]Rpcf{},
		Apij:           map[string]func(a *Rpcpj) (any, error){},
		muSession:      sync.Mutex{},
		Session:        map[string]*Session{},
		Job:            map[string]*Job{},
		Handle:         0,
		FileWatcher:    NewFileWatcher(),
		Runtime:        map[string]Runtime{},
	}

	mux.HandleFunc("/wss", svr.onWebSocket())

	mux.HandleFunc("/api/qr/", func(w http.ResponseWriter, r *http.Request) {
		// b, e := r.GetBody()
		// if e != nil {
		// 	return
		// }
		// bx, e := io.ReadAll(b)

		//sess, ok := svr.GetSession(sessid)
		// if !ok {
		// 	return
		// }
		data := r.URL.Path[8:]
		qr, e := qrcode.New(string(data), qrcode.Medium)
		if e != nil {
			return
		}
		w.Header().Set("Content-Type", "image/png")
		w.WriteHeader(200)
		qr.Write(256, w)
	})

	WebauthnSocket(svr)
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

func (sx *Server) Install() {
	prg := &program{}
	s, err := service.New(prg, &sx.Config.Service)
	if err != nil {
		log.Fatal(err)
	}
	s.Install()
}

func (sx *Server) RunService() {
	prg := &program{}
	s, err := service.New(prg, &sx.Config.Service)
	if err != nil {
		log.Fatal(err)
	}

	logger, err = s.Logger(nil)
	if err != nil {
		log.Fatal(err)
	}

	err = s.Run()
	if err != nil {
		logger.Error(err)
	}
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

type FileSystem struct {
}
type TaskOption interface {
}

func (x *Server) Listen() error {
	return nil
}

// create a directory if it doesn't exist
// watch the directory and run the function on any file that is dropped in it
// the sftp server will allow access to the directory.
// options can use sftp to pull and push to directories on other servers
func (x *Server) FileTask(dir string, then func(path string) error, opt ...TaskOption) error {

	os.MkdirAll(dir, os.ModePerm)
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal("NewWatcher failed: ", err)
	}
	defer watcher.Close()

	done := make(chan bool)
	go func() {
		defer close(done)

		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				log.Printf("%s %s\n", event.Name, event.Op)
				switch event.Op {

				}
			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Println("error:", err)
			}
		}

	}()

	err = watcher.Add(dir)
	if err != nil {
		log.Fatal("Add failed:", err)
	}
	<-done
	return nil

}

// SftpHandler handler for SFTP subsystem
func SftpHandlerx(sess ssh.Session) {
	debugStream := io.Discard
	serverOptions := []sftp.ServerOption{
		sftp.WithDebug(debugStream),
	}
	server, err := sftp.NewServer(
		sess,
		serverOptions...,
	)
	if err != nil {
		log.Printf("sftp server init error: %s\n", err)
		return
	}

	if err := server.Serve(); err == io.EOF {
		server.Close()
		fmt.Println("sftp client exited session.")
	} else if err != nil {
		fmt.Println("sftp server completed with error:", err)
	}
}
