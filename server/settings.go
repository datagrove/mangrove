package server

import (
	"bytes"
	"encoding/json"
	"image/png"

	"github.com/datagrove/mangrove/message"
	"github.com/pquerna/otp/totp"
)

const (
	// test without logging in
	testLogin = true
)

func SettingsApi(mg *Server) error {

	// must be logged in (see connect)
	mg.AddApi("settings", false, func(r *Rpcp) (any, error) {
		if !testLogin && r.Session.Oid == -1 {
			key, e := totp.Generate(totp.GenerateOpts{
				Issuer:      mg.Name,
				AccountName: "test",
			})
			if e != nil {
				return nil, e
			}
			r.Session.Totp = key.Secret()
			// Convert TOTP key into a PNG
			var buf bytes.Buffer
			img, err := key.Image(200, 200)
			if err != nil {
				panic(err)
			}
			png.Encode(&buf, img)
			return &Settings{
				UserSecret:      "",
				Img:             buf.Bytes(),
				Email:           "jimh@datagrove.com",
				Phone:           "+14843664923",
				ActivatePasskey: true,
				ActivateTotp:    true,
			}, nil
		}
		return mg.GetSettings(r.Session)
	})
	// cbor so we can get image
	mg.AddApi("configure", false, func(r *Rpcp) (any, error) {
		var v Settings
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return true, mg.Configure(r.Session, &v)
	})
	mg.AddApij("testEmail", testLogin, func(r *Rpcpj) (any, error) {
		var v struct {
			Email string `json:"email"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		o := &message.Email{
			Sender:    mg.EmailSource,
			Recipient: v.Email,
			Subject:   "Test Email",
			Html:      "",
			Text:      "If you received this email, it means you have configured your email correctly.",
		}
		return true, o.Send()
	})
	mg.AddApij("testVoice", testLogin, func(r *Rpcpj) (any, error) {
		var v struct {
			Phone string `json:"phone"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return true, message.Voice(v.Phone, "Testing delivery of security code")
	})
	mg.AddApij("testSms", testLogin, func(r *Rpcpj) (any, error) {
		var v struct {
			Phone string `json:"phone"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return true, message.Sms(v.Phone, "Testing delivery of security code")
	})
	mg.AddApij("testOtp", testLogin, func(r *Rpcpj) (any, error) {
		var v struct {
			Code string `json:"code"`
		}
		e := json.Unmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return totp.Validate(v.Code, r.Session.Totp), nil
	})
	return nil
}
