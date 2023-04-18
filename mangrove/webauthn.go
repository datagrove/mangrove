package mangrove

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/davecgh/go-spew/spew"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
)

type Session struct {
	User
	Token string
	data  *webauthn.SessionData
}

type SessionStatus struct {
	Token string `json:"token,omitempty"`
}

type User struct {
	ID          string
	Name        string                `json:"name"`
	DisplayName string                `json:"display_name"`
	Icon        string                `json:"icon,omitempty"`
	Credentials []webauthn.Credential `json:"credentials,omitempty"`
	RecoveryKey string                `json:"recovery_key,omitempty"`
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

//	func response(w http.ResponseWriter, d string, c int) {
//		w.Header().Set("Content-Type", "application/json")
//		w.WriteHeader(c)
//		fmt.Fprintf(w, "%s", d)
//	}
func JsonResponse(w http.ResponseWriter, d interface{}, c int) {
	dj, err := json.Marshal(d)
	if err != nil {
		http.Error(w, "Error creating JSON response", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(c)
	fmt.Fprintf(w, "%s", dj)
}

var (
// web  *webauthn.WebAuthn
// data *webauthn.SessionData
// err  error
// user = NewUser("test_user")
)

func NewUser(s string) *User {
	u := &User{}
	u.Name = s
	u.ID = s
	return u
}
func Filter[T any](ss []T, test func(T) bool) (ret []T) {
	for _, s := range ss {
		if test(s) {
			ret = append(ret, s)
		}
	}
	return
}

// make into websockets?
func WebauthnSocket(mg *Server) error {
	wconfig := &webauthn.Config{
		RPDisplayName: "Go Webauthn",                                                                         // Display Name for your site
		RPID:          "localhost",                                                                           // Generally the FQDN for your site
		RPOrigins:     []string{"https://localhost:5078", "http://localhost:8088", "https://localhost:5783"}, // The origin URLs allowed for WebAuthn requests
	}

	web, err := webauthn.New(wconfig)
	if err != nil {
		return err
	}
	mg.AddApi("sessionid", func(r *Rpcp) (any, error) {
		return r.Session.Token, nil
	})

	// allow logging in with recovery codes. After logging in you can add new devices
	mg.AddApi("loginR", func(r *Rpcp) (any, error) {
		var v struct {
			Recovery string `json:"recovery"`
		}
		json.Unmarshal(r.Params, &v)
		return nil, nil
	})

	// how should we safely confirm the recovery code? It's basically a password.

	// add is mostly the same as register?
	mg.AddApi("add", func(r *Rpcp) (any, error) {
		options, session, err := web.BeginRegistration(&r.User)
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
		return nil, nil
	})
	mg.AddApi("remove", func(r *Rpcp) (any, error) {
		r.User.Credentials = Filter(r.User.Credentials, func(e webauthn.Credential) bool {
			return string(e.ID) == string(r.Params)
		})
		mg.SaveUser(&r.User)
		return nil, nil
	})

	// this going to be like register; client must follow up with register2 to save a new credential
	mg.AddApi("recover", func(r *Rpcp) (any, error) {
		// the signature signs the session id
		var v struct {
			Id        string `json:"id"`
			Signature string `json:"signature"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		e = mg.RecoverUser(v.Id, r.Session, v.Signature)
		if e != nil {
			return nil, e
		}
		// return a challenge
		options, session, err := web.BeginRegistration(&r.User)
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
	})

	mg.AddApi("okname", func(r *Rpcp) (any, error) {
		var v struct {
			Id string `json:"id"`
		}
		var rv struct {
			Available bool `json:"available"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		rv.Available = mg.IsAvailableUsername(v.Id)
		return &rv, nil
	})

	// this requires a unique name
	// it can return a session id right away if successfull
	// then the client can try to add a device
	mg.AddApi("register", func(r *Rpcp) (any, error) {
		var v struct {
			Id          string `json:"id"`
			RecoveryKey string `json:"recovery_key"`
		}

		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		u, e := mg.NewUser(v.Id, v.RecoveryKey)
		if e != nil {
			return nil, fmt.Errorf("username already taken")
		}
		r.User = *u

		// return a challenge
		options, session, err := web.BeginRegistration(&r.User)
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
	})

	// this should probably return a session id?
	// we need to binhex appropriate things.
	// we need to check that this is the correct user before allowing a write.
	// so this needs to be protected by the session id.
	mg.AddApi("register2", func(r *Rpcp) (any, error) {
		response, err := protocol.ParseCredentialCreationResponseBody(bytes.NewReader(r.Params))
		if err != nil {
			return nil, err
		}

		// when we create this credential we need to also store it to the user file
		credential, err := web.CreateCredential(&r.User, *r.Session.data, response)
		if err != nil {
			return nil, err
		}
		r.User.Credentials = append(r.User.Credentials, *credential)
		mg.SaveUser(&r.User)
		x, _ := GenerateRandomString(32)
		return &SessionStatus{Token: x}, nil
	})

	// take the user name and return a challenge
	mg.AddApi("login", func(r *Rpcp) (any, error) {
		// options.publicKey contain our registration options
		var v struct {
			Username string `json:"username"`
		}
		json.Unmarshal(r.Params, &v)
		mg.LoadUser(v.Username, &r.User)

		// before we call this we need to load the user credentials
		options, session, err := web.BeginLogin(&r.User)
		if err != nil {

			return nil, err
		}
		r.Session.data = session
		return options, nil
	})

	mg.AddApi("login2", func(r *Rpcp) (any, error) {
		response, err := protocol.ParseCredentialRequestResponseBody(bytes.NewReader(r.Params))
		if err != nil {
			return nil, err
		}

		credential, err := web.ValidateLogin(&r.User, *r.Session.data, response)
		if err != nil {
			return nil, err
		}
		spew.Dump(credential)
		x, _ := GenerateRandomString(32)
		return &SessionStatus{Token: x}, nil
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
