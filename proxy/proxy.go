package main

import (
	"embed"
	"errors"
	"net/http"
	"os"

	"github.com/datagrove/mangrove/scrape"
	"github.com/datagrove/mangrove/server"
	"github.com/kardianos/service"
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

var opt *server.Config

const (
	ProxyFrom = "http://localhost:8080"
)

func GetOpts() *server.Config {
	return &server.Config{
		Config: service.Config{
			Name: "ImisProxy",
		},
		ConfigJson: server.ConfigJson{
			Root:        "",
			ProxyTo:     "https://datagrove_servr",
			Embed:       "/embed/",
			AddrsTLS:    []string{},
			Addrs:       []string{"localhost:8080"},
			EmailSource: "jimh@datagrove.com",
		},

		// we need more features than this
		ProxyLogin: ImisLogin,
		Ui:         Res,
		Launch:     nil,
	}
}

// should we dynamically look up the passwords or transfer them in bulk?
// does it make sense to use a PAKE? Pake needs argon2 to run on the client?
func main() {
	opt = GetOpts()
	cmd := server.DefaultCommands(opt)
	cmd.Execute()
}

const (
	userFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInUserName"
	passFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInPassword"
)

func ImisLogin(user, password string) (*server.ProxyLogin, error) {
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
			enc := []string{}
			for _, c := range cl.Cookies() {
				enc = append(enc, c.String())
			}
			pl := &server.ProxyLogin{
				Home:    ProxyFrom + "/iSamples/MemberR/MemberHome.aspx",
				Email:   "",
				Phone:   "",
				Cookies: enc,
			}
			return pl, nil
		}
	}

	// os.WriteFile("x.html", []byte(cl.Page.Body), 0644)
	// cl.Print()

	return nil, errFailedLogin
}

var errFailedLogin = errors.New("failedLogin")
