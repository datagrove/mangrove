package server

import (
	"context"
	"log"
	"testing"

	"github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	"github.com/fxamacker/cbor/v2"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kardianos/service"
)

func Test_dyn2(t *testing.T) {
	conn, err := pgxpool.New(context.Background(), "postgres://mangrove:mangrove@localhost:5432/mangrove")
	if err != nil {
		log.Fatal(err)
	}
	key := 2
	dl :=
		map[string]any{
			"x": key,
		}
	b, e := cbor.Marshal(dl)
	if e != nil {
		log.Fatal(e)
	}
	e = Delete1(conn, "foo", dl)

	ts := map[string]any{
		"x": key,
		"y": "yo",
	}
	b, e = cbor.Marshal(ts)
	if e != nil {
		log.Fatal(e)
	}

	e = Insert1(conn, "foo", ts)
	if e != nil {
		log.Fatal(e)
	}
	ts2 := map[string]any{
		"x": key,
		"y": "wassup2",
	}
	b, e = cbor.Marshal(ts2)
	if e != nil {
		log.Fatal(e)
	}
	Update1(conn, "foo", []string{"x"}, ts2)
	_ = b

}
func Test_dyn(t *testing.T) {
	conn, err := pgxpool.New(context.Background(), "postgres://mangrove:mangrove@localhost:5432/mangrove")
	if err != nil {
		log.Fatal(err)
	}

	r, e := Read1(conn, "mg.org", map[string]any{
		"oid": 1,
	})
	if e != nil {
		log.Fatal(e)
	}
	log.Printf("r: %v", r)
}

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
