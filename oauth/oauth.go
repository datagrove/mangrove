package oauth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"

	"github.com/joho/godotenv"
)

func AddHandlers(p *mux.Router, host, prefix string) {
	godotenv.Load()
	gothic.Store = sessions.NewCookieStore([]byte("<your secret here>"))
	goth.UseProviders(
		google.New(os.Getenv("GOOGLE_KEY"), os.Getenv("GOOGLE_SECRET"), host+prefix+"/google/callback"),
	)
	p.HandleFunc(prefix+"/{provider}/callback", func(res http.ResponseWriter, req *http.Request) {
		user, err := gothic.CompleteUserAuth(res, req)
		if err != nil {
			return
		}
		b, e := json.Marshal(&user)
		if e != nil {
			return
		}
		res.Write(b)
	})

	// starts the process.
	p.HandleFunc(prefix+"/{provider}", func(res http.ResponseWriter, req *http.Request) {
		// try to get the user without re-authenticating
		if gothUser, err := gothic.CompleteUserAuth(res, req); err == nil {
			b, e := json.Marshal(&gothUser)
			if e != nil {
				return
			}
			res.Write(b)
		} else {
			// otherwise start.
			gothic.BeginAuthHandler(res, req)
		}
	})

	p.HandleFunc(prefix+"/logout/{provider}", func(res http.ResponseWriter, req *http.Request) {
		gothic.Logout(res, req)
		res.Header().Set("Location", "/")
		res.WriteHeader(http.StatusTemporaryRedirect)
	})
	p.HandleFunc(prefix+"/{provider}/test", func(res http.ResponseWriter, req *http.Request) {
		vars := mux.Vars(req)
		provider := vars["provider"]
		res.Write([]byte(fmt.Sprintf("<p><a href='%s/%s'>Log in with %s</a></p>", prefix, provider, provider)))
	})
}
