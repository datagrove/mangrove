package server

import (
	"context"
	"log"
	"testing"

	"github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/kardianos/service"
)

/*
GRANT ALL PRIVILEGES ON ALL Sequences IN SCHEMA mg TO mangrove;
GRANT ALL PRIVILEGES ON ALL Tables IN SCHEMA mg TO mangrove;
*/
func Test_two(t *testing.T) {
	// user:password@host:port/database
	db, e := NewDb("postgres://mangrove:mangrove@localhost:5432/mangrove")
	if e != nil {
		t.Error(e)
	}
	id, e := db.qu.InsertOrg(context.Background(), mangrove_sql.InsertOrgParams{
		Name:          "test",
		IsUser:        false,
		Password:      []byte{},
		HashAlg:       "",
		Email:         pgtype.Text{},
		Mobile:        pgtype.Text{},
		Pin:           "",
		Webauthn:      "",
		Totp:          "",
		Flags:         0,
		TotpPng:       []byte{},
		DefaultFactor: 0,
	})
	log.Printf("id: %v, e: %v", id, e)
}

func Test_one(t *testing.T) {
	// create a test server so we can call functions on it.
	ip := "localhost:3000"
	wconfig := &webauthn.Config{
		RPDisplayName: "Go Webauthn", // Display Name for your site
		RPID:          "localhost",   // Generally the FQDN for your site
		RPOrigins: []string{
			"http://localhost:3000",
			"https://localhost:5078",
			"https://localhost:5783"}, // The origin URLs allowed for WebAuthn requests
	}

	opt := &Config{
		Config: service.Config{
			Name:             "Datagrove",
			DisplayName:      "Datagrove",
			Description:      "Datagrove",
			UserName:         "",
			Arguments:        []string{},
			Executable:       "",
			Dependencies:     []string{},
			WorkingDirectory: "",
			ChRoot:           "",
			Option:           map[string]interface{}{},
			EnvVars:          map[string]string{},
		},
		ConfigJson: ConfigJson{
			Key:           "",
			Https:         "",
			Sftp:          "",
			HttpsCert:     "",
			HttpsPrivate:  "",
			Root:          "",
			AddrsTLS:      []string{},
			Addrs:         []string{ip},
			EmailSource:   "",
			PasskeyConfig: wconfig,
		},

		ProxyLogin:          nil,
		ProxyUpdatePassword: nil,
	}
	j, e := NewServer(opt)
	if e != nil {
		t.Error(e)
	}
	var sess Session
	sess.Name = "anonymous"

	e = j.RegisterPasskey(&sess)
	if e != nil {
		t.Error(e)
	}
	sess.ID = "1234"

}
