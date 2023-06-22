package main

import (
	"context"
	"fmt"
	"io/ioutil"

	"github.com/datagrove/mangrove/rpc"
	"github.com/fxamacker/cbor/v2"
	"github.com/gorilla/websocket"
	"github.com/lestrrat-go/jwx/v2/jwa"
	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jwt"
)

type ZeusLogObject struct {
	DeviceOwner int64 // connect using webrtc.
	Length      int64
	Tail        []byte
	// cold is a blob store
	ColdLength int64
	// which nodes have a copy of the warm data
	WarmReplica []int64
}

const (
	ZtxRead = iota
	ZtxWrite
	ZtxTrim
)

type ZeusLogTx struct {
	op      int
	Payload cbor.RawMessage
}
type ZeusLogWrite struct {
	At   []int64 // fails if this isn't Length
	Data [][]byte
}
type ZeusLogRead struct {
	At []int64
}
type ZeusLogWriteReply struct {
	Ok bool
}
type ZeusLogReadReply struct {
	DeviceOwner int64
	Data        []byte
}

func OurCommit(tx ZeusTx, objects []any) []byte {
	var txp ZeusLogTx
	cbor.Unmarshal(tx.Params, &txp)
	switch txp.op {
	case ZtxRead:

		break
	case ZtxWrite:
		var txw ZeusLogWrite
		cbor.Unmarshal(txp.Payload, &txw)
		fail := false
		for i, at := range txw.At {
			zo := objects[i].(*ZeusLogObject)
			if at != zo.Length {
				fail = true
			}
		}
		if !fail {
			for i, at := range txw.At {
				zo := objects[i].(*ZeusLogObject)
				if at == zo.Length {
					zo.Length += int64(len(txw.Data))
					zo.Tail = append(zo.Tail, txw.Data[i]...)
				}
			}
		}
		var r ZeusLogWriteReply = ZeusLogWriteReply{Ok: !fail}
		b, _ := cbor.Marshal(r)
		return b
	}
	return nil
}

// we can scale this by splitting the sites to different servers
// potentially if we needed to we could also split the site to different servers sharded by the user. if the users are sharded there would be one primary and then secondary servers would call the primary for that site.
// if sharded by user
// should this be more of a btree/leanstore thing? external database? in-memory database. should we shard by cpu/port such that each server running many shards?
const (
	OpRead = iota
	OpWrite
	OpLease
)

type Request struct {
	Op      int
	Session int64
	Site    int64
	Log     int64
	At      int64
	Data    []byte
}

type SiteLogShard struct {
	req chan Request
}

func siteDrain(req chan Request) {
	for {
		m, e := <-req
		if !e {
			return
		}
		_ = m
	}
}
func userDrain(req chan Request) {
	for {
		m, e := <-req
		if !e {
			return
		}
		_ = m
	}
}

// message in channels with wait groups and ids. (promise)

// maybe give each log a flat 64 bit? 32:32?
type WebrtcSession struct {
	app    *DeviceShard
	conn   *websocket.Conn
	iss    string
	device int64
	user   int64

	handle map[int64]Handle // map site.log -> read/write
}
type Handle struct {
	*SiteLogShard
	site  int64
	log   int64
	write bool
}
type GlobalState struct {
	Home     string
	TokenKey jwk.Key
	log      []SiteLogShard
	user     []DeviceShard
}

var g GlobalState

type DeviceConn struct {
	conn *websocket.Conn
}

// runs on its own port, so part of sessions. has its own apiset. does nbio let us single thread this though?
// maybe we should go from a global api to a queue to the user drain
type DeviceShard struct {
	ZeusNode
	device map[int64]*DeviceConn // map device -> conn
}

func NewDeviceShard() *DeviceShard {
	return &DeviceShard{}
}

func (app *DeviceShard) Auth(session *WebrtcSession, site int64, log int64, read bool) error {
	// check cache
	// if not in cache, check auth server
	// if not in auth server, return error
	// if in auth server, cache and return

	return nil
}

func (app *GlobalState) GetSiteLogShard(site int64, log int64) *SiteLogShard {
	return nil
}

func (app *DeviceShard) Push() {
}

// this is probably more like "shard" so shouldn't be global. we can get it from the session.

func Init(home string, m *rpc.ApiMap) error {
	f := home + "/webrtc.json"
	jsonRSAPrivateKey, err := ioutil.ReadFile(f)
	// should generate a key here as needed, but also needs to sync with auth server

	privkey, err := jwk.ParseKey(jsonRSAPrivateKey)
	if err != nil {
		return err
	}
	g.TokenKey = privkey

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
		vt, e := jwt.Parse(b, jwt.WithKey(jwa.RS256, g.TokenKey))
		if e != nil {
			return nil, e
		}
		_ = vt // token verified, can we get data from it?
		session.iss = vt.Issuer()
		session.device = vt.PrivateClaims()["device"].(int64)
		session.user = vt.PrivateClaims()["user"].(int64)

		// connecting a user results in muting the push, creating an online user, and initiating a drain procedure

		return nil, nil
	})

	// a lease needs to read the current log and return webrtc owner if there is one
	// if there isn't one, then make the caller the owner
	m.AddRpc("lease", func(c context.Context, data []byte) (any, error) {
		var v struct {
			Site      int64 `json:"site,omitempty"`
			Log       int64 `json:"log,omitempty"`
			Signature []byte
			Nonce     int64
		}
		e := cbor.Unmarshal(data, &v)
		if e != nil {
			return nil, e
		}
		session := c.Value("session").(*WebrtcSession)
		e = session.app.Auth(session, v.Site, v.Log, true)
		if e != nil {
			return nil, e
		}
		a := g.GetSiteLogShard(v.Site, v.Log)
		if e != nil {
			return nil, e
		}
		a.req <- Request{Session: session.device, Site: v.Site, Log: v.Log}

		return nil, nil
	})
	// pass messages between nodes to facilitate webrtc connections
	m.AddRpc("webrtc", func(c context.Context, data []byte) (any, error) {
		var v struct {
		}
		return nil, nil
	})
	m.AddRpc("attest", func(c context.Context, data []byte) (any, error) {
		// create an entry in the ULDM

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
		if e != nil {
			return nil, e
		}
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
		session := c.Value("session").(*WebrtcSession)
		h, ok := session.handle[v.Handle]
		if !ok || !h.write {
			return nil, fmt.Errorf("handle not found")
		}
		h.req <- Request{Session: session.device, Site: h.site, Log: h.log, At: v.At, Data: v.Data}
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
