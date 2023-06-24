package main

import (
	"crypto/rand"
	"crypto/sha256"

	"github.com/datagrove/mangrove/ucan"
	"github.com/fxamacker/cbor/v2"
)

// the websock proxy is going to suck a lot of energy.
type Client struct {
	challenge [16]byte
	did       []byte
	conn      ClientConn
	handle    map[FileId]bool
	state     int8
}

// client will send op +
const (
	OpOpen = iota
	OpWrite
)

type TxClient struct {
	Op     int8
	Id     int64 // used in replies, acks etc. unique nonce
	Params cbor.RawMessage
}

// log id's are 32 bit database id + 32 bit serial number
// all of these share the same security, so we only need to open once.
type TxOpen struct {
	Id   FileId
	Ucan string
}
type TxWrite struct {
	Handle int64
	Data   []byte
	Author DeviceId   // reply to, saves latency? not necessary?
	PushTo []DeviceId // @joe, @jane, @bob, doesn't need to be replicated.
}

type TxPeer struct {
	Id int64 // used in replies, acks etc. unique nonce
	FileId
	StreamId int32 // maybe 24 bits
	Op       int8
	At       int64
	Data     []byte
	// locks are too expensive here, and in the common case are not needed.
	//Locks    []int64
	Continue bool
}

func (lg *LogShard) RunIo() {
	for fn := range lg.io {
		fn()
	}
}

func (lg *LogShard) ClientConnect(conn ClientConn) {
	cx := &Client{
		conn:   conn,
		handle: map[int64]bool{},
	}

	_, err := rand.Read(cx.challenge[:])
	if err != nil {
		panic(err)
	}
	conn.Send(cx.challenge[:])
	lg.ClientByConn[conn] = cx
}

type Login struct {
	Did       string
	Signature []byte
}

func (lg *LogShard) fromWs(conn ClientConn, data []byte) {

	c, ok := lg.ClientByConn[conn]
	if !ok {
		conn.Close()
		return
	}
	if c.state == 0 {
		var login Login
		cbor.Unmarshal(data, &login)
		hsha2 := sha256.Sum256([]byte(login.Did))
		// data must be an answer to the challenge. The Did must be valid for this shard
		x := int(hsha2[0]) % lg.cluster.NumShards()
		if x != lg.cluster.GlobalShard() {
			conn.Close()
			return
		}
		ok := ucan.VerifyDid(c.challenge[:], login.Did, login.Signature)
		if !ok {
			conn.Close()
			return
		}
		c.state = 1
		c.did = []byte(login.Did)
		return
	}
	var tx TxClient
	cbor.Unmarshal(data, &tx)

	// pick a unique tx id.
	tx.Id = lg.txid
	lg.txid++

	reply := func(result any) {
		type Reply struct {
			Id     int64
			Result any
		}
		b, _ := cbor.Marshal(&Reply{tx.Id, result})
		conn.Send(b)
	}
	fail := func(err string) {
		type Fail struct {
			Id  int64
			Err string
		}
		b, _ := cbor.Marshal(&Fail{tx.Id, err})
		conn.Send(b)
	}
	switch tx.Op {
	case OpOpen:
		var open TxOpen
		cbor.Unmarshal(tx.Params, &open)
		// look up the database
		a, ok := lg.obj[open.Id]
		if !ok {
			// defer to the io thread
			lg.io <- func() {
				lg.db.Exec()
				lg.fromWs(conn, data)
				return
			}
			return
		}
		if a.PublicRights != 0 {
			payload, e := ucan.DecodeUcan(open.Ucan)
			if e != nil {
				fail(e.Error())
			}
			// the ucan must be valid to open this file in this mode
			// the file may be an cache or not
			if len(payload.Grant) != 1 {
				fail("invalid ucan")
			}
			// payload.Grant[0].With
			// payload.Grant[0].Can
			// ok for now
		}
		handle := 1
		reply(handle)

	case OpWrite:
		var write TxWrite
		cbor.Unmarshal(tx.Params, &write)
	}
}

// type Payload struct {
// 	With struct {
// 		Scheme string
// 		HierPart string
// 	}
// 	Can struct {
// 		Namespace string
// 		Segments []string
// 	}
// }

// with: { scheme: "mailto", hierPart: "boris@fission.codes" },

// // `can` is an ability, which always has a namespace and optional segments.
// // → "msg/SEND"
// can: { namespace: "msg", segments: [ "SEND" ] }
