package mangrove

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"embed"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"io/fs"
	"log"
	"math/big"
	"net"
	"net/http"
	"os"
	"path"
	"sync/atomic"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/gliderlabs/ssh"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/kardianos/service"
	"github.com/pkg/sftp"
	"github.com/rs/zerolog"
	"github.com/spf13/cobra"
)

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
type Server struct {
	*Config
	Mux  *http.ServeMux
	Home string
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

func (c *Context) TaskLog() (*Task, error) {
	n := atomic.AddInt64(&c.NextTask, 1)
	a := path.Join(c.Artifacts, fmt.Sprintf("%d", n))
	h, e := os.Create(path.Join(c.Artifacts, "log%d.jsonl"))
	if e != nil {
		return nil, e
	}
	r := &Task{
		c: c,
		// files from this task
		Artifacts: a,
		Log:       zerolog.New(h),
	}
	return r, nil
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
	artifacts := path.Join(home, uuid.NewString())

	return &Context{
		Config:    config,
		Artifacts: artifacts,
		Store:     container,
		Container: ct,
	}, nil
}

func HomeDir(args []string) string {
	if len(args) > 0 {
		return args[0]
	} else {
		return "./store"
	}
}
func DefaultServer(name string, res embed.FS, launch func(*Server) error) *cobra.Command {
	godotenv.Load()
	// DefaultConfig will look in the current directory for a testview.json file
	rootCmd := &cobra.Command{}
	rootCmd.AddCommand(&cobra.Command{
		Use: "install [home directory]",
		Run: func(cmd *cobra.Command, args []string) {
			// use service to install the service
			x, e := NewServer(name, HomeDir(args), res)
			if e != nil {
				log.Fatal(e)
			}
			// how do we add command line paramters?
			x.Install()
		}})
	rootCmd.AddCommand(&cobra.Command{
		Use: "start [home directory]",
		Run: func(cmd *cobra.Command, args []string) {
			x, e := NewServer(name, HomeDir(args), res)
			if e != nil {
				log.Fatal(e)
			}
			launch(x)
			x.Run()
		}})
	rootCmd.AddCommand(&cobra.Command{
		Use: "init [home directory]",
		Run: func(cmd *cobra.Command, args []string) {
			initialize(HomeDir(args))
		}})
	// rootCmd.PersistentFlags().StringVar(&config.Http, "http", ":5078", "http address")
	// rootCmd.PersistentFlags().StringVar(&config.Sftp, "sftp", ":5079", "sftp address")
	// rootCmd.PersistentFlags().StringVar(&config.Store, "store", "TestResults", "test result store")
	rootCmd.Execute()
	return rootCmd
}

func LoadContainer(dir string) (*Container, error) {
	var j Container
	b, e := os.ReadFile(path.Join(dir, "index.jsonc"))
	if e != nil {
		return nil, e
	}
	e = json.Unmarshal(b, &j)
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
	json.Unmarshal(b, &j)
	if len(j.Key) == 0 {
		h, _ := os.UserHomeDir()
		j.Key = path.Join(h, ".ssh", "id_rsa")
	}
	return &j, nil
}
func initialize(dir string) {
	os.MkdirAll(dir, 0777) // permissions here are not correct, should be lower
	os.WriteFile(path.Join(dir, "index.jsonc"), []byte(`{
		"Http": [":5078"],
		"Sftp": ":5079",
	}`), 0777)
}

// directory should already be initalized
// maybe the caller should pass a launch function?
func NewServer(name string, dir string, res embed.FS) (*Server, error) {
	var j Config
	{
		// the user creating the server should become the owner of the server
		h, _ := os.UserHomeDir()
		j.Key = path.Join(h, ".ssh", "id_rsa")
	}

	cf := path.Join(dir, "index.jsonc")
	_, e := os.Stat(cf)
	if e != nil {
		initialize(dir)
	}
	b, e := os.ReadFile(cf)
	if e != nil {
		log.Fatal(e)
	}
	json.Unmarshal(b, &j)
	log.Print(string(b))
	j.Ui = res
	j.Service = service.Config{
		Name:        name,
		DisplayName: name,
		Description: name,
		Arguments:   []string{"start"},
	}

	opt := &j
	if e != nil {
		log.Fatal(e)
	}

	var staticFS = fs.FS(opt.Ui)
	// should this be in config?
	htmlContent, err := fs.Sub(staticFS, "ui/dist")
	if err != nil {
		return nil, err
	}
	fs := http.FileServer(http.FS(htmlContent))
	mux := http.NewServeMux()
	mux.Handle("/", fs)

	return &Server{
		Config: opt,
		Mux:    mux,
		Home:   dir,
	}, nil
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

func (sx *Server) Run() {
	cert := path.Join(sx.Home, "cert.pem")
	key := path.Join(sx.Home, "key.pem")
	_, e := os.Stat(cert)
	if e != nil {
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
	log.Fatal(http.ListenAndServeTLS(sx.Https, cert, key, sx.Mux))
	//certmagic.HTTPS([]string{"example.com"}, mux)

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
