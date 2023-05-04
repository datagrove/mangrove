package mangrove

import (
	"embed"
	"fmt"
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

// get what's know about user,password

type MangroveServer struct {
	Name   string
	Res    embed.FS
	Launch func(*Server) error
	Root   string

	ProxyTo string
	Embed   string

	AddrsTLS    []string //terrible name
	Addrs       []string
	EmailSource string
	// turn a user name and password into a cookie
	ProxyLogin func(user string, pass string) (*ProxyLogin, error)
}
type ProxyLogin struct {
	Home    string   `json:"home,omitempty"`
	Email   string   `json:"email,omitempty"`
	Phone   string   `json:"phone,omitempty"`
	Cookies []string `json:"cookies,omitempty"` // key,value pairs.
}

type LoginInfo struct {
	*ProxyLogin
}

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

// first pull the sign in page, then extract the hidden fields and submit those
// with the username and password. How do I know if the user is logged in already?
// I need some api to tell if the user is logged in already.
const (
	user = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInUserName"
	pass = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInPassword"

	urlx = "http://localhost:8080/iCore/Contacts/Sign_In.aspx?LoginRedirect=true&returnurl=%2fMBRR%2fiSamples%2fMemberR%2fDefault.aspx%3fhkey%3d96ddafab-81a2-4e33-8182-2bdb8439d828"

	page = `<form method='post' action="%s">
	<input name="%s" value="alexm"/>
	<input name="%s" value="demo123" />
	<input type="submit" />
</form>`
)

func getpage() string {
	return fmt.Sprintf(page, urlx, user, pass)
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
			proxy.ModifyResponse = func(resp *http.Response) error {
				// Check if the response is a redirect
				if resp.StatusCode != 304 && resp.StatusCode >= 300 && resp.StatusCode <= 399 {
					// Modify the redirect location to point back to the reverse proxy
					redirectURL, _ := resp.Location()
					redirectURL.Scheme = "http"
					redirectURL.Host = "localhost:8080"
					resp.Header.Set("Location", redirectURL.String())
				}
				return nil
			}

			ProxyRequestHandler := func(proxy *httputil.ReverseProxy) func(http.ResponseWriter, *http.Request) {
				return func(w http.ResponseWriter, r *http.Request) {
					if strings.HasPrefix(r.URL.Path, "/TEST") {
						w.Header().Set("Content-Type", "text/html")
						w.Write([]byte(getpage()))
						return
					}
					if strings.HasPrefix(r.URL.Path, "/iCore/Contacts/Sign_In") {
						http.Redirect(w, r, "/embed/", http.StatusFound)
						return
					}
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
