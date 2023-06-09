package server

import (
	"encoding/json"
	"log"
	"mime"
	"os"
	"path"
	"path/filepath"

	"github.com/datagrove/mangrove/crypto"
	"github.com/datagrove/mangrove/serde"
	"github.com/joho/godotenv"
	"github.com/kardianos/service"
	"github.com/spf13/cobra"
)

// Default Commands
//

func DefaultCommands(opt *Config) *cobra.Command {
	godotenv.Load()

	mime.AddExtensionType(".js", "application/javascript")

	// should we make the service a pointer then so it can be optional?
	if len(opt.Name) == 0 {
		path, err := os.Executable()
		if err != nil {
			panic(err)
		}
		opt.Name = filepath.Base(path)
	}

	// 1. Take the configured Config.Root
	// 2. If there are command line arguments, first one is root
	// 3. Otherwise, use ./store
	if len(opt.Root) == 0 {
		if len(os.Args) > 2 {
			opt.Root = os.Args[2]
		} else {
			p, e := os.UserHomeDir()
			if e != nil {
				log.Fatal(e)
			}
			// bug? this should probably allow override with --name
			opt.Root = path.Join(p, opt.Name)
		}
		var e error
		opt.Root, e = filepath.Abs(opt.Root)
		if e != nil {
			log.Fatal(e)
		}
	}

	_, e := os.Stat(opt.Root)
	if e != nil {
		sx := opt.ConfigJson
		// create a default configuration
		os.MkdirAll(opt.Root, 0755)
		sx.HttpsCert = path.Join(sx.Root, "cert.pem")
		sx.HttpsPrivate = path.Join(sx.Root, "key.pem")
		crypto.MakeCert(sx.HttpsCert, sx.HttpsPrivate)

		b, e := json.MarshalIndent(&sx, "", "  ")
		if e != nil {
			log.Fatal(e)
		}

		os.WriteFile(path.Join(sx.Root, "index.jsonc"), b, 0644)
	} else {
		serde.UnmarshalFile(&opt.ConfigJson, opt.Root, "index.jsonc")
	}

	rootCmd := &cobra.Command{}

	// we need to have options to name the service if we want more thann one service
	// we need to pass the directory to the service, probably resolved
	rootCmd.AddCommand(&cobra.Command{
		Use: "install [home directory]",
		Run: func(cmd *cobra.Command, args []string) {
			// use service to install the service
			x, e := NewServer(opt) // opt.Name, HomeDir(args), opt.Res)
			if e != nil {
				log.Fatal(e)
			}
			// how do we add command line paramters?
			e = x.Install()
			if e != nil {
				log.Fatal(e)
			}
		}})
	rootCmd.AddCommand(&cobra.Command{
		Use: "uninstall [home directory]",
		Run: func(cmd *cobra.Command, args []string) {
			// use service to install the service
			x, e := NewServer(opt) // opt.Name, HomeDir(args), opt.Res)
			if e != nil {
				log.Fatal(e)
			}
			// how do we add command line paramters?
			e = x.Uninstall()
			if e != nil {
				log.Fatal(e)
			}
		}})
	// run runs in the current process, doesn't start as a service
	rootCmd.AddCommand(&cobra.Command{
		Use: "run [home directory]",
		Run: func(cmd *cobra.Command, args []string) {
			x, e := NewServer(opt)
			if e != nil {
				log.Fatal(e)
			}
			if opt.Launch != nil {
				opt.Launch(x)
			}
			x.Start2()

		}})
	// start as a service
	rootCmd.AddCommand(&cobra.Command{
		Use: "start [home directory]",
		Run: func(cmd *cobra.Command, args []string) {
			x, e := NewServer(opt)
			if e != nil {
				log.Fatal(e)
			}
			if opt.Launch != nil {
				opt.Launch(x)
			}
			x.RunService()
		}})
	return rootCmd
}

func (p *Server) Start(s service.Service) error {
	// Start should not block. Do the actual work async.
	go p.run()
	return nil
}
func (p *Server) run() {
	p.Start2()
}
func (p *Server) Stop(s service.Service) error {
	// Stop should not block. Return with a few seconds.
	return nil
}

func (sx *Server) Uninstall() error {
	s, err := service.New(sx, &sx.Config.Service)
	if err != nil {
		log.Fatal(err)
	}
	return s.Uninstall()
}

func (sx *Server) Install() error {

	s, err := service.New(sx, &sx.Config.Service)
	if err != nil {
		log.Fatal(err)
	}
	return s.Install()
}

func (sx *Server) RunService() {
	s, err := service.New(sx, &sx.Config.Service)
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
