package oauth

import (
	"log"
	"net/http"
	"testing"

	"github.com/gorilla/mux"
)

func Test_one(t *testing.T) {

	p := mux.NewRouter()
	p.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		res.Write([]byte("<p><a href='/auth/google'>Log in with Google</a></p>"))
	})

	AddHandlers(p, "http://localhost:3000", "/auth")
	log.Println("listening on localhost:3000")
	log.Fatal(http.ListenAndServe(":3000", p))
}
