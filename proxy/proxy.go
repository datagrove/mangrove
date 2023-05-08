package main

import (
	"embed"
	"errors"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/datagrove/mangrove/scrape"
	"github.com/datagrove/mangrove/server"
	"github.com/kardianos/service"
)

var (
	//go:embed ui/dist/**
	Res            embed.FS
	errFailedLogin = errors.New("failedLogin")
)

const (
	userFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInUserName"
	passFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInPassword"

	emailFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactAccountCreatorCommon$ciNewContactAccountCreatorCommon$Email"

	passCreateFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactAccountCreatorCommon$ciNewContactAccountCreatorCommon$Password"

	phoneFieldName  = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactAccountCreatorCommon$ciNewContactAccountCreatorCommon$Phone"
	mobileFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactAccountCreatorCommon$ciNewContactAccountCreatorCommon$MobilePhone"
)

func main() {
	// we should move these to command line parameters and config file
	proxy_ip := "localhost:8080"
	proxy_proto := "http"
	imis := "https://datagrove_servr"

	proxyLogin := func(user, password string) (*server.ProxyLogin, error) {
		cl, e := scrape.NewClient(imis + "/iCore/Contacts/Sign_In.aspx?LoginRedirect=true&returnurl=%2fMBRR")
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
					Home:    proxy_proto + "://" + proxy_ip + "/iSamples/MemberR/MemberHome.aspx",
					Email:   "",
					Phone:   "",
					Cookies: enc,
				}
				return pl, nil
			}
		}

		return nil, errFailedLogin
	}

	start := func(s *server.Server) error {
		pt, err := url.Parse(imis)
		if err != nil {
			panic(err)
		}
		proxy := httputil.NewSingleHostReverseProxy(pt)
		proxy.ModifyResponse = func(resp *http.Response) error {
			// Check if the response is a redirect
			if resp.StatusCode != 304 && resp.StatusCode >= 300 && resp.StatusCode <= 399 {
				// Modify the redirect location to point back to the reverse proxy
				redirectURL, _ := resp.Location()
				redirectURL.Scheme = proxy_proto // "http"
				redirectURL.Host = proxy_ip      // "localhost:8080"
				resp.Header.Set("Location", redirectURL.String())
			}
			return nil
		}

		ProxyRequestHandler := func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/iCore/Contacts/Sign_In") {
				http.Redirect(w, r, "/embed/", http.StatusFound)
				return
			}
			// we don't need to do anything with create.
			if false && strings.HasPrefix(r.URL.Path, "/MBRR/iCore/Contacts/CreateAccount.aspx") && r.Method == "POST" {
				// parse the form, get email and password
				r.ParseForm()
				email := r.Form.Get(emailFieldName)
				pass := r.Form.Get(passCreateFieldName)
				phone := r.Form.Get(phoneFieldName)
				mobile := r.Form.Get(mobileFieldName)
				if len(mobile) > 0 {
					phone = mobileFieldName
				}

				log.Printf("email: %s, pass: %s", email, pass)

				r.Host = pt.Host
				proxy.ServeHTTP(w, r)
				// if the response is ok, then create the user and password.
				ok := true
				if ok {
					s.CreateUser(email, pass, phone)
				}
			}
			if strings.HasPrefix(r.URL.Path, "/embed/") || r.URL.Path == "/embed" {
				if r.URL.Path == "/embed/wss" {
					s.WsHandler(w, r)
					return
				}
				// Serve files from the embedded file system at /embed
				r.URL.Path = strings.TrimPrefix(r.URL.Path, "/embed")
				s.EmbedHandler.ServeHTTP(w, r)
			} else {
				r.Host = pt.Host
				proxy.ServeHTTP(w, r)
			}
		}

		mux := http.NewServeMux()
		mux.HandleFunc("/", ProxyRequestHandler)
		log.Fatal(http.ListenAndServe(":8080", mux))
		return nil
	}

	opt := &server.Config{
		Config: service.Config{
			Name: "ImisProxy",
		},
		ConfigJson: server.ConfigJson{
			AddrsTLS:    []string{},
			Addrs:       []string{proxy_ip},
			EmailSource: "jimh@datagrove.com",
		},
		Start:      start,
		ProxyLogin: proxyLogin,
		Ui:         Res,
	}

	cmd := server.DefaultCommands(opt)
	cmd.Execute()
}
