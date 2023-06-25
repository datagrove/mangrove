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

type TxClient struct {
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
type TxCreate struct {
	FileId // put in header so we can route without finishing the parsing.
	// we already know the owner did. we might need in the rx version
	Data []byte
}

type TxWrite struct {
	FileId // put in header so we can route without finishing the parsing.
	Rowid  int64
	Data   []byte
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

		// notify the push engine that the device is online

		return
	}
	var tx TxClient
	cbor.Unmarshal(data, &tx)

	// pick a unique tx id.
	tx.Id = lg.txid
	lg.txid++

	canu := func(f *File, mode byte, did []byte) bool {
		return true
	}

	switch tx.Op {

	// open can be a write as well. maybe send to shard that controls the file?
	// make that another instruction. here we don't worry about the cache, get whatever sqlite gives us.
	case OpOpen:
		var open TxOpen
		cbor.Unmarshal(tx.Params, &open)
		// look up the database
		a, ok := lg.State.obj.Get(open.FileId)
		if !ok {
			go func() {
				f, e := lg.db.Open(open.FileId)
				if e != nil {
					c.fail(tx.Id, e.Error())
					return
				}
				if !canu(f, open.Mode, c.did) {
					c.fail(tx.Id, "permission denied")
					return
				}
				c.reply(tx.Id, open.FileId)
			}()
			return
		}
		if a.PublicRights != 0 {
			payload, e := ucan.DecodeUcan(open.Ucan)
			if e != nil {
				c.fail(tx.Id, e.Error())
			}
			// the ucan must be valid to open this file in this mode
			// the file may be an cache or not
			if len(payload.Grant) != 1 {
				c.fail(tx.Id, "invalid ucan")
			}
			// payload.Grant[0].With
			// payload.Grant[0].Can
			// ok for now
		}
		c.reply(tx.Id, open.FileId)
	case OpCommit:
		var wg sync.WaitGroup
		var wait bool
		getOwnership := func(fileid FileId, rowid int64) {
			wait = true
			wg.Add(1)
			go func() {
				wg.Done()
			}()
		}

		var write TxCommit
		cbor.Unmarshal(tx.Params, &write)
		var tpl []*TupleState = make([]*TupleState, len(write.RowId))

		for i, rowid := range write.RowId {
			if rowid == 0 {
				rowid = lg.NewRowId()
				key := fmt.Sprintf("%d:%d", write.FileId, rowid)
				tpl[i] = &TupleState{
					o_state: O_valid,
				}
				lg.tuple.Set(key, tpl[i])
			} else {
				key := fmt.Sprintf("%d:%d", write.FileId, rowid)
				tpl[i], ok = lg.tuple.Get(key)
				if !ok {
					// since we are also a directory, if the key is not in our cache, then it's not in any peer's cache. We can get it out of the database and own it. If it doesn't exist, we can create it. We can send invalidate/validate to all the directories to ensure that we own it. We might need to evict another tuple to make room for this one.
					tpl[i] = &TupleState{
						o_state: O_valid,
					}
					lg.tuple.Set(key, tpl[i])
					claimOwnership(write.FileId, rowid)
				} else {
					getOwnership(write.FileId, rowid)
				}
			}
		}
		if wait {
			go func() {
				wg.Wait()
				lg.client <- Packet{conn, data}
			}()
		} else {
			// if no waits then we alread own all the tuples we need

		}
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
