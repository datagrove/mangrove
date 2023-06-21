package main

import (
	"context"
	"io/ioutil"

	"github.com/datagrove/mangrove/rpc"
	"github.com/fxamacker/cbor/v2"
	"github.com/lestrrat-go/jwx/v2/jwa"
	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jwt"
)

// can I add session state to the context?
// should we

type WebrtcSession struct {
	iss    string
	device int64
	user   int64
}
type WebrtcApp struct {
	TokenKey jwk.Key
}

var app WebrtcApp

func Init(home string, m *rpc.ApiMap) error {
	f := home + "/webrtc.json"
	jsonRSAPrivateKey, err := ioutil.ReadFile(f)
	// should generate a key here as needed, but also needs to sync with auth server

	privkey, err := jwk.ParseKey(jsonRSAPrivateKey)
	if err != nil {
		return err
	}
	app.TokenKey = privkey

	// Tail server api; websocket for latency. Handles online user notification, but defers to notification server.
	// # connect(token)
	// token declares device, user. retrieve/cache profile from auth server, lazy fetch site access from auth table.
	// # lease(site,log)->handle|leaderHandle|needproof
	// call auth server first time, then cache.
	// # signal(leaderHandle, offer|candidate, data)
	// leaderHandle can be random. we could send offer premptively from leader or aspirant, but 99% of time this is not used.
	// we can scan a queue to discover new attestations and revokations and use that to update our access database.
	// # attest(attestation)

	// # read(handle, from) -> data|redirect
	// # write(handle, at, number)

	m.AddRpc("connect", func(c context.Context, data []byte) (any, error) {
		var v struct {
			Token []byte `json:"token,omitempty"`
		}

		e := cbor.Unmarshal(data, &v)
		if e != nil {
			return nil, e
		}
		session := c.Value("session").(*WebrtcSession)
		b := v.Token
		vt, e := jwt.Parse(b, jwt.WithKey(jwa.RS256, app.TokenKey))
		if e != nil {
			return nil, e
		}
		_ = vt // token verified, can we get data from it?
		session.iss = vt.Issuer()
		session.device = vt.PrivateClaims()["device"].(int64)
		session.user = vt.PrivateClaims()["user"].(int64)
		return nil, nil
	})
	m.AddRpc("lease", func(c context.Context, data []byte) (any, error) {

		return nil, nil
	})
	m.AddRpc("signal", func(c context.Context, data []byte) (any, error) {

		return nil, nil
	})
	m.AddRpc("attest", func(c context.Context, data []byte) (any, error) {

		return nil, nil
	})
	m.AddRpc("read", func(c context.Context, data []byte) (any, error) {

		return nil, nil
	})
	m.AddNotify("write", func(c context.Context, data []byte) (any, error) {
		var 
		return nil, nil
	})

	return nil
}

// potentially a call that the publisher can use to get the latest tail data. this can fan out, maybe shard by client?
func publish(tailClient int, lastRead int64) {
	// once all the tail clients have sipped the hose we can trim it.

}

func pushNotify() {


}
