package main

import (
	"context"
	"fmt"
	"io/ioutil"

	"github.com/datagrove/mangrove/rpc"
	"github.com/fxamacker/cbor/v2"
	"github.com/gorilla/websocket"
	"github.com/lestrrat-go/jwx/v2/jwk"
)

type DeviceId int64
type UserId int64
type SiteId int64
type LogId int64

// we can scale this by splitting the sites to different servers
// potentially if we needed to we could also split the site to different servers sharded by the user. if the users are sharded there would be one primary and then secondary servers would call the primary for that site.
// if sharded by user
// should this be more of a btree/leanstore thing? external database? in-memory database. should we shard by cpu/port such that each server running many shards?
const (
	OpRead = iota
	OpWrite
	OpLease
)

// message in channels with wait groups and ids. (promise)

// one shard per ip address/core
// runs on its own port, so part of sessions. has its own apiset. does nbio let us single thread this though?
// maybe we should go from a global api to a queue to the user drain
type DeviceShard struct {
	global *GlobalState
	ZeusNode
	session map[DeviceId]*WebsockSession // map device -> conn
}

func (dev *DeviceShard) ReadLogState(s SiteId, l LogId, out *LogState) error {
	return nil
}

func NewDeviceShard() *DeviceShard {
	return &DeviceShard{}
}

// one per websocket.
type WebsockSession struct {
	shard  *DeviceShard
	conn   *websocket.Conn
	iss    string
	device DeviceId
	user   UserId

	// authorization hash, this session has proved its authority on these logs
	handle map[int64]Handle // map site.log -> read/write
}
type Handle struct {
	site  int64
	log   int64
	write bool
}
type GlobalState struct {
	Home     string
	TokenKey jwk.Key
	// we need multiple device shards on different ip addresses so we don't run out of ports.
	user []DeviceShard
	// do we need a cache of log objects other than what we read from zeus key store?
}

// might need to add the session? we shard by device, so we need that.
// do we need a session id that's not the device id? maybe just log them out if they manage to do it.
func (app *GlobalState) SendDevice(d DeviceId, m []byte) {
	// find the device
	// send the message
}

// this is probably more like "shard" so shouldn't be global. we can get it from the session.

func Init(home string, m *rpc.ApiMap) (*GlobalState, error) {
	f := home + "/webrtc.json"
	jsonRSAPrivateKey, err := ioutil.ReadFile(f)
	// should generate a key here as needed, but also needs to sync with auth server

	privkey, err := jwk.ParseKey(jsonRSAPrivateKey)
	if err != nil {
		return nil, err
	}
	r := &GlobalState{Home: home,
		TokenKey: privkey,
	}

	// a lease needs to read the current log and return webrtc owner if there is one
	// if there isn't one, then make the caller the owner
	m.AddRpc("lease", func(c context.Context, data []byte) (any, error) {
		var v struct {
			Site      SiteId `json:"site,omitempty"`
			Log       LogId  `json:"log,omitempty"`
			Signature []byte
			Nonce     int64
		}
		type LeaseInfo struct {
			Handle int64
			Leader DeviceId
		}

		e := cbor.Unmarshal(data, &v)
		if e != nil {
			return nil, e
		}
		session := c.Value("session").(*WebsockSession)

		cacheHandle := int64(v.Site<<32) + int64(v.Log)
		h, ok := session.handle[cacheHandle]
		if !ok {
			// read the log state from zeus
			// if there is a webrtc owner, then return that
			// note that the request and leaders may on different front ends
			// so we need our signaling to handle this.
			// if there isn't one, then make the caller the owner
			var state LogState
			session.shard.ReadLogState(v.Site, v.Log, &state)
		}
		//
		return h, nil
	})
	// pass messages between nodes to facilitate webrtc connections
	m.AddRpc("webrtc", func(c context.Context, data []byte) (any, error) {
		var v struct {
			DeviceId int64 `json:"userId,omitempty"`
		}
		e := cbor.Unmarshal(data, &v)
		if e != nil {
			return nil, e
		}
		session := c.Value("session").(*WebsockSession)
		session.shard.global.SendDevice(DeviceId(v.DeviceId), data)
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
	// some queues may be public, like the merkesquare, don't need to be leased or leadered.
	m.AddRpc("publish", func(c context.Context, data []byte) (any, error) {
		var v struct {
			Log   LogId
			Entry []byte
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
		session := c.Value("session").(*WebsockSession)
		h, ok := session.handle[v.Handle]
		if !ok || !h.write {
			return nil, fmt.Errorf("handle not found")
		}
		// h.req <- Request{Session: session.device, Site: h.site, Log: h.log, At: v.At, Data: v.Data}
		cr := &ZeusTx{}
		session.shard.ZeusNode.ClientReq <- cr

		return nil, nil
	})

	return r, nil
}

// potentially a call that the publisher can use to get the latest tail data. this can fan out, maybe shard by client?
func publish(tailClient int, lastRead int64) {
	// once all the tail clients have sipped the hose we can trim it.

}

func pushNotify() {

}

// adapt Zeus

type LogState struct {
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
			zo := objects[i].(*LogState)
			if at != zo.Length {
				fail = true
			}
		}
		if !fail {
			for i, at := range txw.At {
				zo := objects[i].(*LogState)
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
