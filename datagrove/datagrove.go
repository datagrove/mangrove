package main

import (
	"embed"
	"log"
	"os"

	"github.com/datagrove/mangrove/server"
	"github.com/datagrove/mangrove/tasks"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/kardianos/service"
	"github.com/spf13/cobra"
)

var (
	//go:embed ui/dist/**
	Res embed.FS
)

func main() {
	os.Args = []string{"dg", "start"}
	ip := "localhost:3000"
	wconfig := &webauthn.Config{
		RPDisplayName: "Go Webauthn", // Display Name for your site
		RPID:          "localhost",   // Generally the FQDN for your site
		RPOrigins: []string{
			"http://localhost:3000",
			"https://localhost:5078",
			"https://localhost:5783"}, // The origin URLs allowed for WebAuthn requests
	}

	opt := &server.Config{
		Config: service.Config{
			Name:             "Datagrove",
			DisplayName:      "Datagrove",
			Description:      "Datagrove",
			UserName:         "",
			Arguments:        []string{},
			Executable:       "",
			Dependencies:     []string{},
			WorkingDirectory: "",
			ChRoot:           "",
			Option:           map[string]interface{}{},
			EnvVars:          map[string]string{},
		},
		ConfigJson: server.ConfigJson{
			Key:           "",
			Https:         "",
			Sftp:          ":2023",
			HttpsCert:     "",
			HttpsPrivate:  "",
			Root:          "/Users/jim/dev/dgdata",
			AddrsTLS:      []string{},
			Addrs:         []string{ip},
			EmailSource:   "",
			PasskeyConfig: wconfig,
		},

		ProxyLogin:          nil,
		ProxyUpdatePassword: nil,

		Ui: Res,
	}
	rootCmd := server.DefaultCommands(opt)
	rootCmd.AddCommand(&cobra.Command{
		Use: "sftp source target",
		Run: func(cmd *cobra.Command, args []string) {
			source := args[0]
			target := args[1]
			tasks.SftpCopy(source, target, 22, "")
			// use service to install the service
			x, e := server.NewServer(opt) // opt.Name, HomeDir(args), opt.Res)
			if e != nil {
				log.Fatal(e)
			}
			// how do we add command line paramters?
			e = x.Install()
			if e != nil {
				log.Fatal(e)
			}
		}})
	rootCmd.Execute()
}

/*
func main() {
	// we should move these to command line parameters and config file
	proxy_ip := "localhost:3000"
	proxy_proto := "http"
	imis := "https://datagrove_servr"
	host := proxy_proto + "://" + proxy_ip
	prefix := "/auth"
	home := proxy_proto + "://" + proxy_ip + "/iSamples/MemberR/MemberHome.aspx"

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
					Home:    home,
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
			log.Printf("Url %s", r.URL.Path)
			if r.URL.Path == "/" {
				http.Redirect(w, r, "/MBRR/", http.StatusFound)
				return
			}

			// this is the signin. If they have previously chosen a social login we can try that first, then fall back to the proxy login
			// the social login can be stored in a cookie, so that we get it back here.
			if strings.HasPrefix(r.URL.Path, "/iCore/Contacts/Sign_In") ||
				strings.HasPrefix(r.URL.Path, "/MBRR/SignIn") {

				// get the cookie indicating the social login, then redirect to the social login
				// note that this is not too obscure because we likely have timed them out of the site cookie, but they will be logged into their social account
				// we don't want to check automatically, because that's going to potentially pull them away from the site and show unrequest dialogs
				// with some logins (e.g. google) we can check automatically and show them as logged in even from the home page.
				// google identity services. automatic signin

				http.Redirect(w, r, prefix+"/en/login", http.StatusFound)
				return
			}

			if strings.HasPrefix(r.URL.Path, prefix+"/") || r.URL.Path == prefix {
				if r.URL.Path == prefix+"/wss" {
					s.WsHandler(w, r)
					return
				}
				// Serve files from the embedded file system
				r.URL.Path = r.URL.Path[9:]
				s.EmbedHandler.ServeHTTP(w, r)
			} else {
				r.Host = pt.Host
				proxy.ServeHTTP(w, r)
			}
		}

		done := func(w http.ResponseWriter, r *http.Request, user goth.User) {
			// here we have to do our fake login and set the cookies.
			// we have to try to get the password from our database.
			pass, e := s.GetPasswordFromEmail(user.Email)
			if e != nil {
				// !!todo this email address has not been registered, we need to allow them to enter their password first
				// we should prepopulate their email address and store their choice of social login. Put these in local storage?
				http.Redirect(w, r, prefix+"/en/login", http.StatusFound)
			}
			u, e := proxyLogin(user.Email, pass)
			if e != nil {
				log.Printf("failed to login %s", e.Error())
				return
			}
			// this should be simpler, post the email and password to the login and be done with it?
			for _, c := range u.Cookies {
				if strings.HasPrefix(c, "login=") {
					w.Header().Add("Set-Cookie", c+"; Path=/; ")
					log.Printf("cookie %s", c)
				}
			}
			http.Redirect(w, r, home, http.StatusFound)
		}
		//
		mux := mux.NewRouter()
		mux.HandleFunc("/", ProxyRequestHandler)
		mux.NotFoundHandler = http.HandlerFunc(ProxyRequestHandler)
		oauth.AddHandlers(mux, host, prefix, done)
		mux.HandleFunc("/wss", func(w http.ResponseWriter, r *http.Request) {
			s.WsHandler(w, r)
		})
		log.Fatal(http.ListenAndServe(":3000", mux))
		return nil
	}
	wconfig := &webauthn.Config{
		RPDisplayName: "Go Webauthn",                                                                         // Display Name for your site
		RPID:          "localhost",                                                                           // Generally the FQDN for your site
		RPOrigins:     []string{"https://localhost:5078", "http://localhost:3000", "https://localhost:5783"}, // The origin URLs allowed for WebAuthn requests
	}
	opt := &server.Config{
		Config: service.Config{
			Name: "ImisProxy",
		},
		ConfigJson: server.ConfigJson{
			AddrsTLS:      []string{},
			Addrs:         []string{proxy_ip},
			EmailSource:   "jimh@datagrove.com",
			PasskeyConfig: wconfig,
		},
		Start:      start,
		ProxyLogin: proxyLogin,
		Ui:         Res,
	}

	cmd := server.DefaultCommands(opt)
	cmd.Execute()
}


	emailFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactAccountCreatorCommon$ciNewContactAccountCreatorCommon$Email"

	passCreateFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactAccountCreatorCommon$ciNewContactAccountCreatorCommon$Password"

	phoneFieldName  = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactAccountCreatorCommon$ciNewContactAccountCreatorCommon$Phone"
	mobileFieldName = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactAccountCreatorCommon$ciNewContactAccountCreatorCommon$MobilePhone"


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
*/
