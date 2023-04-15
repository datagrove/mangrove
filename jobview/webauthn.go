package jobview

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/davecgh/go-spew/spew"
)

const (
	create = `{
		publicKey: {
		  challenge: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
		  rp: { name: "Localhost, Inc." },
		  user: {
			id: "IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII",
			name: "test_user",
			displayName: "Test User",
		  },
		  pubKeyCredParams: [],
		  excludeCredentials: [],
		  authenticatorSelection: { userVerification: "discouraged" },
		  extensions: {
			credProps: true,
		  },
		},
	  }`

	login = ` {
		publicKey: {
		  challenge: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
		  allowCredentials: registeredCredentials(),
		  userVerification: "discouraged",
		},
	  }`
)

type Session struct {
	Id string `json:"id,omitempty"`
}

func jsonResponse(w http.ResponseWriter, d interface{}, c int) {
	dj, err := json.Marshal(d)
	if err != nil {
		http.Error(w, "Error creating JSON response", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(c)
	fmt.Fprintf(w, "%s", dj)
}

func Webauthn(mux *http.ServeMux) error {
	mux.HandleFunc("/api/register", func(w http.ResponseWriter, r *http.Request) {
		var cr interface{}
		json.Unmarshal([]byte(create), &cr)
		jsonResponse(w, cr, 200)
	})

	// this should probably return a session id?
	mux.HandleFunc("/api/register2", func(w http.ResponseWriter, r *http.Request) {
		var v interface{}
		json.NewDecoder(r.Body).Decode(&v)
		x, _ := GenerateRandomString(32)
		jsonResponse(w, &Session{Id: x}, 200)
	})

	// take the user name and return a challenge
	mux.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		var v struct {
			Username string `json:"username"`
		}
		json.NewDecoder(r.Body).Decode(&v)
		var cr interface{}
		json.Unmarshal([]byte(login), &cr)
		jsonResponse(w, cr, 200)
	})

	mux.HandleFunc("/api/login2", func(w http.ResponseWriter, r *http.Request) {
		var v interface{}
		json.NewDecoder(r.Body).Decode(&v)
		spew.Dump(v)
		x, _ := GenerateRandomString(32)
		jsonResponse(w, &Session{Id: x}, 200)
	})

	return nil

}

// GenerateRandomBytes returns securely generated random bytes.
// It will return an error if the system's secure random
// number generator fails to function correctly, in which
// case the caller should not continue.
func GenerateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	// Note that err == nil only if we read len(b) bytes.
	if err != nil {
		return nil, err
	}

	return b, nil
}

// GenerateRandomString returns a URL-safe, base64 encoded
// securely generated random string.
// It will return an error if the system's secure random
// number generator fails to function correctly, in which
// case the caller should not continue.
func GenerateRandomString(s int) (string, error) {
	b, err := GenerateRandomBytes(s)
	return base64.URLEncoding.EncodeToString(b), err
}
