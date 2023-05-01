package mangrove

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
)

// move to mangrove

type MangroveServer struct {
	Name   string
	Res    embed.FS
	Launch func(*Server) error
	Root   string

	ProxyTo string
	Embed   string

	AddrsTLS      []string //terrible name
	Addrs         []string
	OnLogin       func() string
	PasswordLogin func(user, password string, info *ChallengeInfo) bool
	EmailSource   string
}

type LoginInfo struct {
	Error  int
	Cookie string `json:"cookie,omitempty"`
	Home   string `json:"home,omitempty"` // where to go after login
}

// challenge type can be "optional" or "required" to indicate that the user may or should add a key
type ChallengeNotify struct {
	ChallengeType   string `json:"challenge_type,omitempty"`
	ChallengeSentTo string `json:"challenge_sent_to,omitempty"`
}
type ChallengeInfo struct {
	// either login or challenge info
	LoginInfo *LoginInfo `json:"login_info,omitempty"`
	ChallengeNotify
	Challenge string `json:"challenge,omitempty"`
}

func HomeDir(opt *MangroveServer, args []string) {
	if len(opt.Root) > 0 {
		return
	}
	if len(args) > 0 {
		opt.Root = args[0]
	} else {
		opt.Root = "./store"
	}
}

func DefaultCommands(opt *MangroveServer) *cobra.Command {
	godotenv.Load()

	// DefaultConfig will look in the current directory for a testview.json file
	rootCmd := &cobra.Command{}
	rootCmd.AddCommand(&cobra.Command{
		Use: "install [home directory]",
		Run: func(cmd *cobra.Command, args []string) {
			// use service to install the service
			HomeDir(opt, args)
			x, e := NewServer(opt) // opt.Name, HomeDir(args), opt.Res)
			if e != nil {
				log.Fatal(e)
			}
			// how do we add command line paramters?
			x.Install()
		}})
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
			if false {
				x.Run()
			}
			ws := x.onWebSocket()

			url, err := url.Parse(opt.ProxyTo)
			if err != nil {
				panic(err)
			}
			var staticFS = fs.FS(opt.Res)
			// should this be in config?
			htmlContent, err := fs.Sub(staticFS, "ui/dist")
			if err != nil {
				panic(err)
			}
			fs := http.FileServer(&spaFileSystem{http.FS(htmlContent)})

			proxy := httputil.NewSingleHostReverseProxy(url)
			ProxyRequestHandler := func(proxy *httputil.ReverseProxy) func(http.ResponseWriter, *http.Request) {
				return func(w http.ResponseWriter, r *http.Request) {
					if strings.HasPrefix(r.URL.Path, "/embed/") || r.URL.Path == "/embed" {
						if r.URL.Path == "/embed/ws" {
							ws(w, r)
							return
						}
						// Serve files from the embedded file system at /embed
						r.URL.Path = strings.TrimPrefix(r.URL.Path, "/embed")
						fs.ServeHTTP(w, r)
					} else {
						r.Host = url.Host
						proxy.ServeHTTP(w, r)
					}
				}
			}
			// handle all requests to your server using the proxy
			http.HandleFunc("/", ProxyRequestHandler(proxy))
			log.Fatal(http.ListenAndServe(":8080", nil))
		}})
	rootCmd.AddCommand(&cobra.Command{
		Use: "init [home directory]",
		Run: func(cmd *cobra.Command, args []string) {
			HomeDir(opt, args)
			//initialize()
		}})
	// rootCmd.PersistentFlags().StringVar(&config.Http, "http", ":5078", "http address")
	// rootCmd.PersistentFlags().StringVar(&config.Sftp, "sftp", ":5079", "sftp address")
	// rootCmd.PersistentFlags().StringVar(&config.Store, "store", "TestResults", "test result store")
	return rootCmd
}

/*

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
			if launch != nil {
				launch(x)
			}
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
*/
