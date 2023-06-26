package main

import (
	"crypto/rand"
	"crypto/sha256"
	"sync"

	"github.com/cornelk/hashmap"
	"github.com/datagrove/mangrove/ucan"
	"github.com/fxamacker/cbor/v2"
)

// is it faster to get ownership from a shard on the same peer? zeus says it uses locking locally to get ownership

// the websock proxy is going to suck a lot of energy.
// we should try a goroutine per connection? that would give us single threaded access without locking.
type Client struct {
	sync.Mutex
	challenge [16]byte
	did       []byte
	conn      ClientConn
	handle    hashmap.Map[FileId, byte]
	state     int8
}

func (c *Client) reply(id int64, result any) {
	type Reply struct {
		Id     int64
		Result any
	}
	b, _ := cbor.Marshal(&Reply{id, result})
	c.conn.Send(b)
}

func (c *Client) fail(id int64, err string) {
	type Fail struct {
		Id  int64
		Err string
	}
	b, _ := cbor.Marshal(&Fail{id, err})
	c.conn.Send(b)
}

// client will send op +
const (
	OpOpen = iota
	OpCommit
	OpRead
	OpWatch
)

type RpcClient struct {
	Op     byte
	Id     int64 // used in replies, acks etc. unique nonce
	Params cbor.RawMessage
}

func (lg *LogShard) ApproveConnection(c *Client, data []byte) bool {
	type Login struct {
		Did       string `json:"did,omitempty"`
		Signature []byte `json:"signature,omitempty"`
	}
	var login Login
	cbor.Unmarshal(data, &login)
	hsha2 := sha256.Sum256([]byte(login.Did))
	// data must be an answer to the challenge. The Did must be valid for this shard
	x := int(hsha2[0]) % lg.cluster.NumShards()
	if x != lg.cluster.GlobalShard() {
		return false
	}
	ok := ucan.VerifyDid(c.challenge[:], login.Did, login.Signature)
	if !ok {
		return false
	}
	c.did = []byte(login.Did)
	return true
	// notify the push engine that the device is online
}

func (lg *LogShard) ClientConnect(conn ClientConn) {
	cx := &Client{
		conn:   conn,
		handle: hashmap.Map[FileId, byte]{},
	}

	_, err := rand.Read(cx.challenge[:])
	if err != nil {
		panic(err)
	}
	conn.Send(cx.challenge[:])
	lg.ClientByConn[conn] = cx
}
func (lg *LogShard) fromWs(conn ClientConn, data []byte) {
	// note this exists because we created it in connect.
	c, ok := lg.ClientByConn[conn]
	if !ok {
		conn.Close()
		return
	}
	if c.state == 0 {
		if !lg.ApproveConnection(c, data) {
			conn.Close()
		}
		c.state = 1
		return
	}
	var tx RpcClient
	cbor.Unmarshal(data, &tx)
	switch tx.Op {
	case OpOpen: // open can be pipelined.
		ExecOpen(lg, c, &tx)
	case OpCommit:
		ExecTx(lg, c, &tx)
	}
}
