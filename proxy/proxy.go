package main

import (
	"embed"
	"errors"
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/datagrove/mangrove/mangrove"
	"github.com/datagrove/mangrove/scrape"
)

var (
	//go:embed ui/dist/**
	Res embed.FS
)

// ProxyRequestHandler handles the http request using proxy

// a SpaFileSystem is a http.FileSystem that will serve index.html for any path that does not exist
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

var opt *mangrove.MangroveServer

func GetOpts() *mangrove.MangroveServer {
	return &mangrove.MangroveServer{
		Name:     "sample",
		Res:      Res,
		Launch:   nil,
		Root:     "",
		ProxyTo:  "https://datagrove_servr",
		Embed:    "/embed/",
		AddrsTLS: []string{},
		Addrs:    []string{"localhost:8080"},

		EmailSource: "jimh@datagrove.com",

		OnLogin: func() string {
			return "https://www.google.com"
		},

		ProxyLogin: ImisLogin,
	}
}

// should we dynamically look up the passwords or transfer them in bulk?
// does it make sense to use a PAKE? Pake needs argon2 to run on the client?
func main() {
	opt = GetOpts()
	cmd := mangrove.DefaultCommands(opt)
	cmd.Execute()
}

func justEmbed() {
	mux := http.NewServeMux()

	var staticFS = fs.FS(Res)
	// should this be in config?
	htmlContent, err := fs.Sub(staticFS, "ui/dist")
	if err != nil {
		panic(err)
	}
	fs := http.FileServer(&spaFileSystem{http.FS(htmlContent)})
	mux.Handle("/embed/", http.StripPrefix("/embed/", fs))

	log.Fatal(http.ListenAndServe(":8080", mux))
}

func justEmbed2() {
	mux := http.NewServeMux()

	var staticFS = fs.FS(Res)
	// should this be in config?
	htmlContent, err := fs.Sub(staticFS, "ui/dist")
	if err != nil {
		panic(err)
	}
	fs := http.FileServer(&spaFileSystem{http.FS(htmlContent)})
	mux.Handle("/", fs)

	log.Fatal(http.ListenAndServe(":8080", mux))
}

const (
	userFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInUserName"
	passFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInPassword"
)

func ImisLogin(user, password string) (*mangrove.ProxyLogin, error) {
	cl, e := scrape.NewClient(opt.ProxyTo + "/iCore/Contacts/Sign_In.aspx?LoginRedirect=true&returnurl=%2fMBRR")
	if e != nil {
		return nil, e
	}
	// this postback should get the login cookie
	cl.Page.Form[userFieldName] = user
	cl.Page.Form[passFieldName] = password
	e = cl.PostBack("ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$SubmitButton", "Sign In")
	if e != nil {
		return nil, e
	}
	for _, c := range cl.Cookies() {
		if c.Name == "login" {
			pl := &mangrove.ProxyLogin{
				Home:    opt.ProxyTo + "iSamples/MemberR/MemberHome.aspx",
				Email:   "",
				Phone:   "",
				Cookies: []*http.Cookie{c},
			}
			return pl, nil
		}
	}

	// os.WriteFile("x.html", []byte(cl.Page.Body), 0644)
	// cl.Print()

	return nil, failedLoginErr
}

var failedLoginErr = errors.New("failedLogin")
