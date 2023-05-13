package server

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/davecgh/go-spew/spew"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
)

type Device struct {
	Id   string `json:"id"`
	Name string
}

func (u *PasskeyCredential) WebAuthnID() []byte {
	return []byte(u.ID)
}

// WebAuthnName provides the name attribute of the user account during registration and is a human-palatable name for the user
// account, intended only for display. For example, "Alex Müller" or "田中倫". The Relying Party SHOULD let the user
// choose this, and SHOULD NOT restrict the choice more than necessary.
//
// Specification: §5.4.3. User Account Parameters for Credential Generation (https://w3c.github.io/webauthn/#dictdef-publickeycredentialuserentity)
func (u *PasskeyCredential) WebAuthnName() string {
	return u.Name
}

// WebAuthnDisplayName provides the name attribute of the user account during registration and is a human-palatable
// name for the user account, intended only for display. For example, "Alex Müller" or "田中倫". The Relying Party
// SHOULD let the user choose this, and SHOULD NOT restrict the choice more than necessary.
//
// Specification: §5.4.3. User Account Parameters for Credential Generation (https://www.w3.org/TR/webauthn/#dom-publickeycredentialuserentity-displayname)
func (u *PasskeyCredential) WebAuthnDisplayName() string {
	return u.Name
}

// WebAuthnCredentials provides the list of Credential objects owned by the user.
func (u *PasskeyCredential) WebAuthnCredentials() []webauthn.Credential {
	return u.Credential
}

// WebAuthnIcon is a deprecated option.
// Deprecated: this has been removed from the specification recommendation. Suggest a blank string.
func (u *PasskeyCredential) WebAuthnIcon() string {
	return ""
}

var _ webauthn.User = (*PasskeyCredential)(nil)

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

func NewUser(s string) *PasskeyCredential {
	u := &PasskeyCredential{}
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
	web, err := webauthn.New(mg.PasskeyConfig)
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

	mg.AddApij("connect", false, func(r *Rpcpj) (any, error) {
		var v struct {
			UserSecret string `json:"usersecret"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		r.Session.Oid = mg.SecretToUser(v.UserSecret)
		return mg.GetSettings(r.Session)
	})

	mg.AddApij("recover", false, func(r *Rpcpj) (any, error) {
		var v struct {
			Email string `json:"email"`
			Phone string `json:"phone"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		mg.RecoverPasswordChallenge(r.Session, v.Email, v.Phone)
		return nil, nil
	})
	// same as loginpassword2?
	mg.AddApij("recover2", false, func(r *Rpcpj) (any, error) {
		var v struct {
			Secret string `json:"secret"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		if v.Secret != r.Session.Secret {
			return nil, errBadLogin
		}
		mg.RecoverPasswordResponse(r.Session, v.Secret)
		return true, nil
	})
	mg.AddApij("recover3", false, func(r *Rpcpj) (any, error) {
		var v struct {
			Secret   string `json:"secret"`
			Password string `json:"password"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		mg.RecoverPasswordResponse2(r.Session, v.Secret, v.Password)
		// how do we change the password in proxied app?
		return nil, nil
	})

	// how should we safely confirm the recovery code? It's basically a password.
	// add is mostly the same as register?
	mg.AddApij("addCredential", true, func(r *Rpcpj) (any, error) {
		options, session, err := web.BeginRegistration(&r.PasskeyCredential)
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
	})
	mg.AddApi("removeCredential", true, func(r *Rpcp) (any, error) {
		r.PasskeyCredential.Credential = Filter(r.PasskeyCredential.Credential, func(e webauthn.Credential) bool {
			return string(e.ID) == string(r.Params)
		})
		mg.SaveUser(&r.PasskeyCredential)
		return nil, nil
	})

	mg.AddApij("addpasskey", false, func(r *Rpcpj) (any, error) {
		if r.Oid < 0 {
			return nil, errors.New("login_first")
		}
		r.PasskeyCredential.ID = fmt.Sprintf("%d", r.Oid)
		// does this get baked into credential? that would be an argument for getting a name first.
		r.PasskeyCredential.DisplayName = r.Name
		r.PasskeyCredential.Name = r.Name
		options, session, err := web.BeginRegistration(&r.PasskeyCredential)
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
		credential, err := web.CreateCredential(&r.PasskeyCredential, *r.Session.data, response)
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
		r.PasskeyCredential.ID = v.Device
		// does this get baked into credential? that would be an argument for getting a name first.
		r.PasskeyCredential.DisplayName = v.Device
		r.PasskeyCredential.Name = v.Device
		options, session, err := web.BeginRegistration(&r.PasskeyCredential)
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
	})

	// user name, not unique. produce challenge
	mg.AddApij("register", false, func(r *Rpcpj) (any, error) {
		var v struct {
			Name string `json:"name"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		r.DisplayName = r.Name
		r.Name = v.Name
		options, session, err := web.BeginRegistration(&r.PasskeyCredential)
		if err != nil {
			return nil, err
		}
		r.Session.data = session
		return options, nil
	})
	// part 2 of register, create a unique user.
	mg.AddApij("registerb", false, func(r *Rpcpj) (any, error) {
		response, err := protocol.ParseCredentialCreationResponseBody(bytes.NewReader(r.Params))
		if err != nil {
			return nil, err
		}
		// when we create this credential we need to also store it to the user file

		credential, err := web.CreateCredential(&r.PasskeyCredential, *r.Session.data, response)
		if err != nil {
			return nil, err
		}
		_ = credential
		//mg.RegisterPasskey(r.Session, credential)
		return true, nil
	})

	// email and password
	mg.AddApij("register2", false, func(r *Rpcpj) (any, error) {
		var v struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		e = mg.RegisterEmailPassword(r.Session, v.Email, v.Password)
		if e != nil {
			return nil, e
		}
		return true, nil
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
		credential, err := web.CreateCredential(&r.PasskeyCredential, *r.Session.data, response)
		if err != nil {
			return nil, err
		}
		// may not exist yet, that's not an error
		_ = mg.LoadDevice(&r.PasskeyCredential, r.ID)
		r.PasskeyCredential.Credential = append(r.Session.PasskeyCredential.Credential, *credential)
		e = mg.NewDevice(&r.Session.PasskeyCredential)
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
				return &r.PasskeyCredential, nil
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
		e := mg.LoadDevice(&r.PasskeyCredential, v.Device)
		if e != nil {
			return nil, e
		}

		// before we call this we need to load the user credentials
		options, session, err := web.BeginLogin(&r.PasskeyCredential)
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

		credential, err := web.ValidateLogin(&r.PasskeyCredential, *r.Session.data, response)
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
