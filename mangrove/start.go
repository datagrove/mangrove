package mangrove

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"

	"github.com/fsnotify/fsnotify"
	"github.com/gliderlabs/ssh"
	"github.com/joho/godotenv"
	"github.com/kardianos/service"
	"github.com/pkg/sftp"
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
	Connection map[string]*SshConnection `json:"connection,omitempty"`

	Key     string `json:"key,omitempty"`
	Http    string `json:"http,omitempty"`
	Sftp    string `json:"sftp,omitempty"`
	Store   string `json:"test_root,omitempty"`
	Ui      embed.FS
	Service service.Config
}
type Server struct {
	*Config
	Mux *http.ServeMux
}

func NewServer(opt *Config) (*Server, error) {
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
	}, nil
}
func DefaultConfig(name string) (*Config, error) {
	h, _ := os.UserHomeDir()
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	var j Config
	j.Key = path.Join(h, ".ssh", "id_rsa")
	b, e := os.ReadFile(".private/" + name + ".json")
	if e != nil {
		log.Fatal(e)
	}
	json.Unmarshal(b, &j)
	j.Service = service.Config{
		Name:        name,
		DisplayName: name,
		Description: name,
	}

	return &j, nil
}

// start as service
func (sx *Server) Run() {
	go func() {
		log.Fatal(http.ListenAndServe(sx.Http, sx.Mux))
	}()

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
	debugStream := ioutil.Discard
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

func startSftp(config *Config) {
	go func() {

		ssh_server := ssh.Server{
			Addr: config.Sftp,
			PublicKeyHandler: func(ctx ssh.Context, key ssh.PublicKey) bool {
				return true
			},
			SubsystemHandlers: map[string]ssh.SubsystemHandler{
				"sftp": SftpHandlerx,
			},
		}
		kf := ssh.HostKeyFile(config.Key)
		kf(&ssh_server)
		log.Fatal(ssh_server.ListenAndServe())
	}()
}
