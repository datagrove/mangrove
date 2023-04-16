package jobview

import (
	"fmt"
	"testing"

	"github.com/davecgh/go-spew/spew"
	"github.com/go-webauthn/webauthn/webauthn"
)

func Test_w(t *testing.T) {
	wconfig := &webauthn.Config{
		RPDisplayName: "Go Webauthn",                               // Display Name for your site
		RPID:          "go-webauthn.local",                         // Generally the FQDN for your site
		RPOrigins:     []string{"https://login.go-webauthn.local"}, // The origin URLs allowed for WebAuthn requests
	}
	if web, err = webauthn.New(wconfig); err != nil {
		fmt.Println(err)
	}
	st := NewUser("test")

	options, session, err := web.BeginRegistration(st)
	_ = options
	_ = session
	_ = err
	spew.Dump(options)
}
