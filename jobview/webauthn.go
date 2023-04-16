package jobview

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/davecgh/go-spew/spew"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
)

type Session struct {
	Id string `json:"id,omitempty"`
}

type UserSession struct {
	Username string
	Webauthn *webauthn.SessionData
}

type User struct {
	ID          string
	Name        string                `json:"name"`
	DisplayName string                `json:"display_name"`
	Icon        string                `json:"icon,omitempty"`
	Credentials []webauthn.Credential `json:"credentials,omitempty"`
}

func (u *User) WebAuthnID() []byte {
	return []byte(u.ID)
}

// WebAuthnName provides the name attribute of the user account during registration and is a human-palatable name for the user
// account, intended only for display. For example, "Alex Müller" or "田中倫". The Relying Party SHOULD let the user
// choose this, and SHOULD NOT restrict the choice more than necessary.
//
// Specification: §5.4.3. User Account Parameters for Credential Generation (https://w3c.github.io/webauthn/#dictdef-publickeycredentialuserentity)
func (u *User) WebAuthnName() string {
	return u.Name
}

// WebAuthnDisplayName provides the name attribute of the user account during registration and is a human-palatable
// name for the user account, intended only for display. For example, "Alex Müller" or "田中倫". The Relying Party
// SHOULD let the user choose this, and SHOULD NOT restrict the choice more than necessary.
//
// Specification: §5.4.3. User Account Parameters for Credential Generation (https://www.w3.org/TR/webauthn/#dom-publickeycredentialuserentity-displayname)
func (u *User) WebAuthnDisplayName() string {
	return u.Name
}

// WebAuthnCredentials provides the list of Credential objects owned by the user.
func (u *User) WebAuthnCredentials() []webauthn.Credential {
	return u.Credentials
}

// WebAuthnIcon is a deprecated option.
// Deprecated: this has been removed from the specification recommendation. Suggest a blank string.
func (u *User) WebAuthnIcon() string {
	return ""
}

var _ webauthn.User = (*User)(nil)

func response(w http.ResponseWriter, d string, c int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(c)
	fmt.Fprintf(w, "%s", d)
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

var (
	web  *webauthn.WebAuthn
	data *webauthn.SessionData
	err  error
	user = NewUser("test_user")
)

func NewUser(s string) *User {
	u := &User{}
	u.Name = s
	u.ID = s
	return u
}

func Webauthn(mux *http.ServeMux) error {
	wconfig := &webauthn.Config{
		RPDisplayName: "Go Webauthn",                      // Display Name for your site
		RPID:          "localhost",                        // Generally the FQDN for your site
		RPOrigins:     []string{"https://localhost:5783"}, // The origin URLs allowed for WebAuthn requests
	}

	if web, err = webauthn.New(wconfig); err != nil {
		fmt.Println(err)
	}

	mux.HandleFunc("/api/register", func(w http.ResponseWriter, r *http.Request) {
		options, session, err := web.BeginRegistration(user)
		data = session
		if err != nil {
			log.Printf("error: %v", err)
		}
		// this might not be enough? we might need to binhex the challenge
		b, e := json.Marshal(options)
		if e != nil {
			log.Printf("error: %v", e)
			return
		}
		response(w, string(b), 200)
	})

	// this should probably return a session id?
	// we need to binhex appropriate things.
	mux.HandleFunc("/api/register2", func(w http.ResponseWriter, r *http.Request) {
		response, err := protocol.ParseCredentialCreationResponseBody(r.Body)
		if err != nil {
			log.Printf("error: %v", err)
			return
		}
		session := data
		credential, err := web.CreateCredential(user, *session, response)
		if err != nil {
			log.Printf("error: %v", err)
			return
		}
		user.Credentials = append(user.Credentials, *credential)
		x, _ := GenerateRandomString(32)
		jsonResponse(w, &Session{Id: x}, 200)
	})

	// take the user name and return a challenge
	mux.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		// options.publicKey contain our registration options
		var v struct {
			Username string `json:"username"`
		}
		json.NewDecoder(r.Body).Decode(&v)

		options, session, err := web.BeginLogin(user)
		if err != nil {
			log.Print(err)
			return
		}
		data = session

		jsonResponse(w, options, http.StatusOK) // return the options generated
	})

	mux.HandleFunc("/api/login2", func(w http.ResponseWriter, r *http.Request) {
		response, err := protocol.ParseCredentialRequestResponseBody(r.Body)
		if err != nil {
			return
		}
		session := data

		credential, err := web.ValidateLogin(user, *session, response)
		if err != nil {
			return
		}
		spew.Dump(credential)
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
