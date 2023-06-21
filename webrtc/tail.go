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

// we can scale this by splitting the sites to different servers
// potentially if we needed to we could also split the site to different servers sharded by the user. if the users are sharded there would be one primary and then secondary servers would call the primary for that site.
// if sharded by user
// should this be more of a btree/leanstore thing? external database? in-memory database. should we shard by cpu/port such that each server running many shards?
type SiteLog struct {
	Length int64
}

// message in channels with wait groups and ids. (promise)

// maybe give each log a flat 64 bit? 32:32?
type WebrtcSession struct {
	app    *WebrtcApp
	iss    string
	device int64
	user   int64

	authCache map[int64]byte // map site.log -> read/write
}
type WebrtcApp struct {
	TokenKey jwk.Key
	sharded  bool // if there is more than one site, then we need an extra hop to write the server responsible for a given site. Plus each server needs to broadcast their updates to the other servers.

	cache map[int64]SiteLog // map site -> log
}

// sharding users would eliminate need for locking here.
func (app *WebrtcApp) Auth(session *WebrtcSession, site int64, log int64, read bool) error {
	// check cache
	// if not in cache, check auth server
	// if not in auth server, return error
	// if in auth server, cache and return

	return nil
}

func (app *WebrtcApp) GetSiteLog() error {
}

func (app *WebrtcApp) Push() {
}

// this is probably more like "shard" so shouldn't be global. we can get it from the session.

func Init(app *WebrtcApp, home string, m *rpc.ApiMap) error {
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
		var v struct {
			Site int64 `json:"site,omitempty"`
			Log  int64 `json:"log,omitempty"`
		}
		return nil, nil
	})
	m.AddRpc("signal", func(c context.Context, data []byte) (any, error) {

		return nil, nil
	})
	m.AddRpc("attest", func(c context.Context, data []byte) (any, error) {

		return nil, nil
	})
	// anyone can read, we can also redirect the write to blob storage.
	// if we are sharded, what does it take to do DSR? would doing webrtc allow a better solution? it seems like a webrtc connection would as expensive as a tcp one, if not more so.
	m.AddRpc("read", func(c context.Context, data []byte) (any, error) {
		var v struct {
			Handle int64 `json:"handle,omitempty"`
			From   int64 `json:"from,omitempty"`
		}
		e := cbor.Unmarshal(data, &v)
		return nil, nil
	})
	m.AddNotify("write", func(c context.Context, data []byte) (any, error) {
		// is not waiting a bad idea here? the leader writes should always be allowed, otherwise not.
		var v struct {
			Handle int64  `json:"handle,omitempty"`
			At     int64  `json:"at,omitempty"`
			Data   []byte `json:"number,omitempty"`
		}
		e := cbor.Unmarshal(data, &v)
		if e != nil {
			return nil, e
		}
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
