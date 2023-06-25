package main

import (
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"sync"

	"github.com/cornelk/hashmap"
	"github.com/datagrove/mangrove/ucan"
	"github.com/fxamacker/cbor/v2"
)

// is it faster to get ownership from a shard on the same peer? zeus says it uses locking locally to get ownership
func (lg *LogShard) NewRowId() int64 {
	lg.NextRowId++
	return lg.NextRowId
}

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

// log id's are 32 bit database id + 32 bit serial number
// all of these share the same security, so we only need to open once.
type TxOpen struct {
	FileId // put in header so we can route without finishing the parsing.
	Ucan   string
	Mode   byte
	// create a file in one step
}
type TxPush struct {
	FileId            // put in header so we can route without finishing the parsing.
	Rowid  int64      // needed for a link to the original write
	Data   []byte     // not necessarily the tuple, probably a summary.
	PushTo []DeviceId // @joe, @jane, @bob, doesn't need to be replicated.
}

// we don't care about rifl here, because the version will be bumped so a repeat will fail. the client will merge, and see its the same and not send.
type TxCommit struct {
	FileId
	// row id of 0 means to insert and return a new row id
	Read    []int64
	RowId   []int64
	Version []int64
	Data    [][]byte
	// if all versions are trimmed, the tuple is deleted
	Trim []int64
}
type TxResult struct {
	error string
	Read  [][]byte
	RowId []int64
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

type Login struct {
	Did       string
	Signature []byte
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

// change these to fork and lock for database reads
// run read in their own thread since they may block on io.
func (lg *LogShard) Read(fid int64, rid int64) ([][]byte, error) {
	key := fmt.Sprintf("%d:%d", fid, rid)
	tp, ok := lg.tuple.Get(key)
	if ok {
		return tp.data, nil
	}
	// read from the database, get ownership first
	return nil, nil
}

func (lg *LogShard) ApproveConnection(c *Client, data []byte) bool {
	var login Login
	cbor.Unmarshal(data, &login)
	hsha2 := sha256.Sum256([]byte(login.Did))
	// data must be an answer to the challenge. The Did must be valid for this shard
	x := int(hsha2[0]) % lg.cluster.NumShards()
	if x != lg.cluster.GlobalShard() {
		conn.Close()
	}
	ok := ucan.VerifyDid(c.challenge[:], login.Did, login.Signature)
	if !ok {
		return false
	}
	c.state = 1
	c.did = []byte(login.Did)
	return true
	// notify the push engine that the device is online
}

func (lg *LogShard) fromWs(conn ClientConn, data []byte) {
	c, ok := lg.ClientByConn[conn]
	if !ok {
		conn.Close()
		return
	}
	if c.state == 0 {
		if !lg.ApproveConnection(c, data) {
			conn.Close()
		}
		return
	}
	var tx RpcClient
	cbor.Unmarshal(data, &tx)

	switch tx.Op {

	// open can be pipelined.
	case OpOpen:
		var op = &ExecOpen{conn, lg}
		op.Exec()
	case OpCommit:
		var write TxCommit
		cbor.Unmarshal(tx.Params, &write)
		txe := &TxExecution{lg, tx.Id, &write}
		txe.Exec()
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
