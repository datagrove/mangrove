package main

import (
	"crypto/rand"
	"crypto/sha256"

	"github.com/datagrove/mangrove/ucan"
	"github.com/fxamacker/cbor/v2"
)

// the websock proxy is going to suck a lot of energy.
//

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
type TxOpen struct {
	LogId1 int32
	LogId2 int32
	Mode   int8
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
		return
	}
	var tx TxClient
	cbor.Unmarshal(data, &tx)

	// pick a unique tx id.
	tx.Id = lg.txid
	lg.txid++

	switch tx.Op {
	case OpOpen:
		var open TxOpen
		cbor.Unmarshal(tx.Params, &open)
	case OpWrite:
		var write TxWrite
		cbor.Unmarshal(tx.Params, &write)
	}
}
