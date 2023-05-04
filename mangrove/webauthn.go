package mangrove

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"

	"github.com/davecgh/go-spew/spew"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
)

type RegisterInfo struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
}
type Session struct {
	Oid int64
	UserDevice
	Device string // device for this session
	Secret string
	data   *webauthn.SessionData
	mu     sync.Mutex
	//Watch    []*Watch
	// maps a fid to a stream handle
	Handle   map[int64]StreamHandle
	Notifier SessionNotifier
	RegisterInfo
	Mobile    string
	Email     string
	Voice     string
	Challenge string
	Totp      string
	*LoginInfo
	DefaultFactor int
	FactorValue   string // hold a value while we are testing it.
}
type StreamHandle struct {
	*Stream
	flags int
}
type Stream struct {
	mu        sync.Mutex
	db        int64
	fid       int64
	openCount int64
	listen    map[*Session]int64
}
type SessionNotifier interface {
	Notify(handle int64, data interface{})
}

// returns a handle to the home session
// we should also return a client diff if they ask for an update.
type SessionStatus struct {
	Home int32 `json:"token,omitempty"`
}

// Device      map[string]*Device    `json:"device"`
type User struct {
	Alias  []*UserAlias
	Device []*UserDevice
}
type UserAlias struct {
	Id string `json:"id"`
}

type UserDevice struct {
	ID          string                `json:"id"`
	Name        string                `json:"name"`
	DisplayName string                `json:"display_name"`
	Icon        string                `json:"icon,omitempty"`
	Credentials []webauthn.Credential `json:"credentials,omitempty"`
	RecoveryKey string                `json:"recovery_key,omitempty"`
	Home        string
	User        *User
	LoginUcan   string `json:"login_ucan,omitempty"`
}

var _ webauthn.User = (*UserDevice)(nil)

type Device struct {
	Id   string `json:"id"`
	Name string
}

func (u *UserDevice) WebAuthnID() []byte {
	return []byte(u.ID)
}

// WebAuthnName provides the name attribute of the user account during registration and is a human-palatable name for the user
// account, intended only for display. For example, "Alex Müller" or "田中倫". The Relying Party SHOULD let the user
// choose this, and SHOULD NOT restrict the choice more than necessary.
//
// Specification: §5.4.3. User Account Parameters for Credential Generation (https://w3c.github.io/webauthn/#dictdef-publickeycredentialuserentity)
func (u *UserDevice) WebAuthnName() string {
	return u.Name
}

// WebAuthnDisplayName provides the name attribute of the user account during registration and is a human-palatable
// name for the user account, intended only for display. For example, "Alex Müller" or "田中倫". The Relying Party
// SHOULD let the user choose this, and SHOULD NOT restrict the choice more than necessary.
//
// Specification: §5.4.3. User Account Parameters for Credential Generation (https://www.w3.org/TR/webauthn/#dom-publickeycredentialuserentity-displayname)
func (u *UserDevice) WebAuthnDisplayName() string {
	return u.Name
}

// WebAuthnCredentials provides the list of Credential objects owned by the user.
func (u *UserDevice) WebAuthnCredentials() []webauthn.Credential {
	return u.Credentials
}

// WebAuthnIcon is a deprecated option.
// Deprecated: this has been removed from the specification recommendation. Suggest a blank string.
func (u *UserDevice) WebAuthnIcon() string {
	return ""
}

var _ webauthn.User = (*UserDevice)(nil)

//	func response(w http.ResponseWriter, d string, c int) {
//		w.Header().Set("Content-Type", "application/json")
//		w.WriteHeader(c)
//		fmt.Fprintf(w, "%s", d)
//	}
func JsonResponse(w http.ResponseWriter, d interface{}, c int) {
	dj, err := sockMarshall(d)
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

func NewUser(s string) *UserDevice {
	u := &UserDevice{}
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

type Update struct {
}

// cbor messages can begin with 0 - that doesn't make sense for json
// make into websockets?
func WebauthnSocket(mg *Server) error {
	wconfig := &webauthn.Config{
		RPDisplayName: "Go Webauthn",                                                                         // Display Name for your site
		RPID:          "localhost",                                                                           // Generally the FQDN for your site
		RPOrigins:     []string{"https://localhost:5078", "http://localhost:8080", "https://localhost:5783"}, // The origin URLs allowed for WebAuthn requests
	}

	web, err := webauthn.New(wconfig)
	if err != nil {
		return err
	}
	mg.AddApi("sessionid", false, func(r *Rpcp) (any, error) {
		return r.Session.Secret, nil
	})

	mg.AddApi("query", true, func(r *Rpcp) (any, error) {
		var v struct {
			Snapshot []byte
			Begin    []byte
			End      []byte
		}
		sockUnmarshal(r.Params, &v)

		var outv struct {
			Snapshot []byte `json:"snapshot"`
		}
		return &outv, nil
	})

	mg.AddApi("mkdir", true, func(r *Rpcp) (any, error) {
		var v struct {
			Path string `json:"path"`
		}
		sockUnmarshal(r.Params, &v)
		return nil, mg.Mkdir(v.Path, r.Session)
	})
	mg.AddApi("rm", true, func(r *Rpcp) (any, error) {
		var v struct {
			Path string `json:"path"`
		}
		sockUnmarshal(r.Params, &v)

		return nil, mg.Rm(v.Path, r.Session)
	})
	mg.AddApi("mv", true, func(r *Rpcp) (any, error) {
		var v struct {
			From string `json:"from"`
			To   string `json:"to"`
		}
		sockUnmarshal(r.Params, &v)

		return nil, mg.Mv(v.From, v.To, r.Session)

	})
	mg.AddApi("cp", true, func(r *Rpcp) (any, error) {
		var v struct {
			From string `json:"from"`

			To string `json:"to"`
		}
		sockUnmarshal(r.Params, &v)
		return nil, mg.Cp(v.From, v.To, r.Session)
	})
	mg.AddApi("upload", true, func(r *Rpcp) (any, error) {
		var v struct {
			Path string `json:"path"`
			Data []byte `json:"data"`
		}
		sockUnmarshal(r.Params, &v)
		return nil, mg.Upload(v.Path, v.Data, r.Session)
	})
	mg.AddApi("download", true, func(r *Rpcp) (any, error) {
		var v struct {
			Path string `json:"path"`
		}
		sockUnmarshal(r.Params, &v)

		return mg.Download(v.Path, r.Session)
	})

	// how should we safely confirm the recovery code? It's basically a password.
	// add is mostly the same as register?
	mg.AddApij("addCredential", true, func(r *Rpcpj) (any, error) {
		options, session, err := web.BeginRegistration(&r.UserDevice)
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
	})
	mg.AddApi("removeCredential", true, func(r *Rpcp) (any, error) {
		r.UserDevice.Credentials = Filter(r.UserDevice.Credentials, func(e webauthn.Credential) bool {
			return string(e.ID) == string(r.Params)
		})
		mg.SaveUser(&r.UserDevice)
		return nil, nil
	})

	mg.AddApij("addpasskey", false, func(r *Rpcpj) (any, error) {
		if r.Oid < 0 {
			return nil, errors.New("login_first")
		}
		r.UserDevice.ID = fmt.Sprintf("%d", r.Oid)
		// does this get baked into credential? that would be an argument for getting a name first.
		r.UserDevice.DisplayName = r.Name
		r.UserDevice.Name = r.Name
		options, session, err := web.BeginRegistration(&r.UserDevice)
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
	})
	mg.AddApij("addpasskey2", false, func(r *Rpcpj) (any, error) {
		response, err := protocol.ParseCredentialCreationResponseBody(bytes.NewReader(r.Params))
		if err != nil {
			return nil, err
		}
		// when we create this credential we need to also store it to the user file
		credential, err := web.CreateCredential(&r.UserDevice, *r.Session.data, response)
		if err != nil {
			return nil, err
		}
		mg.StoreFactor(r.Session, kPasskey, "", credential)
		return true, nil
	})

	mg.AddApij("registerdevice", false, func(r *Rpcpj) (any, error) {
		var v struct {
			Device string `json:"device"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		r.UserDevice.ID = v.Device
		// does this get baked into credential? that would be an argument for getting a name first.
		r.UserDevice.DisplayName = v.Device
		r.UserDevice.Name = v.Device
		options, session, err := web.BeginRegistration(&r.UserDevice)
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
	})

	// always creates with a password
	// we don't have a way to proxy this yet, so disable for demo.
	// we may want to handle this directly from the proxy anyway so we can use the existing form (not an option for login)
	mg.AddApij("createuser", false, func(r *Rpcpj) (any, error) {
		e := json.Unmarshal(r.Params, &r.Session.RegisterInfo)
		if e != nil {
			return nil, e
		}
		_, e = mg.Register(r.Session)
		if e != nil {
			return nil, e
		}
		return mg.GetLoginInfo(r.Session)
	})

	// 	r.UserDevice.ID = fmt.Sprintf("%d", r.Oid)

	// 	// does this get baked into credential? that would be an argument for getting a name first.
	// 	r.UserDevice.DisplayName = r.Username
	// 	r.UserDevice.Name = r.Username
	// 	options, session, err := web.BeginRegistration(&r.UserDevice)
	// 	if err != nil {
	// 		return nil, err
	// 	}
	// 	r.Session.data = session
	// 	return options, nil
	// })
	// this registers a new user, we need a different way to add a device credential
	// when we cross echo-systems we will need to store a local passkey

	// we take the approach of generating a new user, then merging this into the user set.
	// return the temporary user name
	mg.AddApij("registerdevice2", false, func(r *Rpcpj) (any, error) {
		var e error
		response, err := protocol.ParseCredentialCreationResponseBody(bytes.NewReader(r.Params))
		if err != nil {
			return nil, err
		}
		// when we create this credential we need to also store it to the user file
		credential, err := web.CreateCredential(&r.UserDevice, *r.Session.data, response)
		if err != nil {
			return nil, err
		}
		// may not exist yet, that's not an error
		_ = mg.LoadDevice(&r.UserDevice, r.ID)
		r.UserDevice.Credentials = append(r.Session.UserDevice.Credentials, *credential)
		e = mg.NewDevice(&r.Session.UserDevice)
		if e != nil {
			return nil, e
		}
		return true, nil
	})

	mg.AddApij("okname", false, func(r *Rpcpj) (any, error) {
		var v struct {
			Name string `json:"name"`
		}
		json.Unmarshal(r.Params, &v)
		return mg.OkName(r.Session, v.Name), nil
	})

	mg.AddApi("gettotp", true, func(r *Rpcp) (any, error) {
		a, e := mg.Db.qu.SelectOrg(context.Background(), r.Oid)
		if e != nil {
			return nil, e
		}

		type Totp struct {
			Img    []byte `json:"img,omitempty"`
			Secret string `json:"secret,omitempty"`
		}
		rx := Totp{
			Img:    a.TotpPng,
			Secret: a.Totp,
		}
		return &rx, nil
	})

	// don't store in the database until we check it.
	mg.AddApij("addfactor", true, func(r *Rpcpj) (any, error) {
		var v struct {
			Type  int    `json:"type"`
			Value string `json:"value"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		// add factor only changes the session

		r.Session.DefaultFactor = v.Type
		r.Session.FactorValue = v.Value
		switch v.Type {
		case kEmail:
			r.Session.Email = v.Value
		case kMobile:
			r.Session.Mobile = v.Value
		case kVoice:
			r.Session.Mobile = v.Value
		}

		return mg.SendChallenge(r.Session)
	})
	// check the challenge and add the factor
	mg.AddApij("addfactor2", true, func(r *Rpcpj) (any, error) {
		var v struct {
			Challenge string `json:"challenge"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		if mg.ValidateChallenge(r.Session, v.Challenge) {
			// store the factor
			mg.StoreFactor(r.Session, r.Session.DefaultFactor, r.Session.FactorValue, nil)
			return true, nil
		} else {
			return nil, errors.New("invalid")
		}
	})

	// we will need to login first with just a password, then we can add a factor
	// later we can offer a registration form
	mg.AddApij("loginpassword", false, func(r *Rpcpj) (any, error) {
		var v struct {
			Username string `json:"username"`
			Password string `json:"password"`
			Pref     int    `json:"pref"` // which credential to challenge with
		}

		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}

		// this can fail if the user doesn't exist in our database yet
		// if it fails we try the proxy login
		return mg.PasswordLogin(r.Session, v.Username, v.Password, 0)

	})

	// validates the 2FA challenge after logging in with a password
	mg.AddApij("loginpassword2", false, func(r *Rpcpj) (any, error) {
		var v struct {
			Challenge string `json:"challenge"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		if mg.ValidateChallenge(r.Session, v.Challenge) {
			return mg.GetLoginInfo(r.Session)
		} else {
			return nil, errors.New("invalid")
		}
	})
	// take the user name and return a challenge
	// we might want to allow this to log directly into a user?
	mg.AddApij("login", false, func(r *Rpcpj) (any, error) {

		// before we call this we need to load the user credentials
		options, session, err := web.BeginDiscoverableLogin()
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
	})

	mg.AddApij("login2", false, func(r *Rpcpj) (any, error) {
		response, err := protocol.ParseCredentialRequestResponseBody(bytes.NewReader(r.Params))
		if err != nil {
			return nil, err
		}

		handler := func(rawID, userHandle []byte) (webauthn.User, error) {
			e := mg.LoadWebauthnUser(r.Session, string(userHandle))
			//e := mg.LoadDevice(&r.UserDevice, string(userHandle))
			if e != nil {
				return nil, e
			} else {
				return &r.UserDevice, nil
			}
		}
		credential, err := web.ValidateDiscoverableLogin(handler, *r.Session.data, response)
		_ = credential
		if err != nil {
			return nil, err
		}

		// we already have a challenge before now. return the user site
		// or potentially return a hash of the document (latest commit?)
		// we are going to subscribe to this document and always get updates
		// so we can return a subscription handle to it? this could be a random handle
		// we could also use the did as a handle. we could use 64 bit int, and keep it in a local map. basically watch handle for a recursive directory.
		//ws, e := mg.AddWatch(v.Path, r.Session, r.Id, v.Filter, 0)
		// the handle returned is specific to the session.

		return mg.GetLoginInfo(r.Session)

	})
	// take the user name and return a challenge
	// we might want to allow this to log directly into a user?
	mg.AddApij("loginx", false, func(r *Rpcpj) (any, error) {
		// options.publicKey contain our registration options
		var v struct {
			Device string `json:"device"`
			User   string `json:"user"`
		}
		json.Unmarshal(r.Params, &v)
		e := mg.LoadDevice(&r.UserDevice, v.Device)
		if e != nil {
			return nil, e
		}

		// before we call this we need to load the user credentials
		options, session, err := web.BeginLogin(&r.UserDevice)
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
	})

	mg.AddApij("loginx2", false, func(r *Rpcpj) (any, error) {
		response, err := protocol.ParseCredentialRequestResponseBody(bytes.NewReader(r.Params))
		if err != nil {
			return nil, err
		}

		credential, err := web.ValidateLogin(&r.UserDevice, *r.Session.data, response)
		if err != nil {
			return nil, err
		}
		spew.Dump(credential)

		// we already have a challenge before now. return the user site
		// or potentially return a hash of the document (latest commit?)
		// we are going to subscribe to this document and always get updates
		// so we can return a subscription handle to it? this could be a random handle
		// we could also use the did as a handle. we could use 64 bit int, and keep it in a local map. basically watch handle for a recursive directory.
		//ws, e := mg.AddWatch(v.Path, r.Session, r.Id, v.Filter, 0)
		// the handle returned is specific to the session.
		return mg.GetLoginInfo(r.Session)
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

// don't store the user until we have a credential
// u, e := mg.NewUser(v.Id, v.RecoveryKey)
// if e != nil {
// 	return nil, fmt.Errorf("username already taken")
// }
// r.User = *u

// return a challenge
// if the user already exists because of a failure?
// we can sign the submitted did, that will give us the authority to add the credential

// should this user be shared with other connections?
// currently it is not.
// this requires a unique name
// it can return a session id right away if successfull
// then the client can try to add a device
