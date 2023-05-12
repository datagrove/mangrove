package oauth

import (
	"encoding/json"
	"log"
	"net/http"
	"testing"

	"github.com/gorilla/mux"
	"github.com/markbates/goth"
)

func Test_one(t *testing.T) {

	p := mux.NewRouter()
	p.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		res.Write([]byte("<p><a href='/auth/google'>Log in with Google</a></p>"))
	})
	done := func(w http.ResponseWriter, r *http.Request, user goth.User) {
		b, e := json.Marshal(&user)
		if e != nil {
			return
		}
		w.Write(b)
	}
	AddHandlers(p, "http://localhost:3000", "/auth", done)
	log.Println("listening on localhost:3000")
	log.Fatal(http.ListenAndServe(":3000", p))
}
