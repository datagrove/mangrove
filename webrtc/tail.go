package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/datagrove/mangrove/rpc"

	"github.com/cornelk/hashmap"
	"github.com/fxamacker/cbor/v2"
	"github.com/gorilla/websocket"
	"github.com/lestrrat-go/jwx/v2/jwk"
)

// Log states are always replicated to the entire cluster.
// each node in the cluster is responsible for a shard of devices. It publishes to those devices either over direct connection or push.
// one node is primary for each file. Reads go to secondary devices. This arrangement allows a node to be replaced quickly. The primary node, if its empty, can read files as it goes from a random machine in the cluster, spreading the recovery load

type DeviceId = int64
type UserId int64
type LogId int64
type PeerId int64

type Pair struct {
	LogId
	LogState
}
type Peer interface {
	Send([]byte)
}
type ClusterPeer struct {
	Node []Peer
	Dir  []Peer // a subset of node, there are only 3 directory nodes in the cluster (or world?)
}

type RemoteWrite struct {
	// reply back through established connection
	// reply is only yes/no, the replication data is

	From  DeviceId // enough to direct the error to the peer.
	At    int64
	LogId LogId
	Data  []byte // also indicates a write, otherwise its a read.
}

type GlobalState struct {
	Me        PeerId
	Object    hashmap.Map[LogId, *LogState]
	Cooling   []LogState
	Replicate chan *LogState
	Unflushed chan *LogState
	ClusterPeer
	Home     string
	TokenKey jwk.Key
	// we need multiple device shards on different ip addresses so we don't run out of ports.
	DeviceShard []DeviceShard
	Peer        []Peer
	// do we need a cache of log objects other than what we read from zeus key store?
	Mem  []byte
	Next []uint32 // point to previous page

	msg chan RemoteWrite
}

func (g *GlobalState) Run1() {

	for x := range g.msg {
		obj, ok := g.Object.Get(x.LogId)
		if !ok {
			// restore from disk or another node
		}
		// reply immediately without going through the replication queue?
		// the submitter will need to update their known length to allow read your writes, but is that a thing? the writer already has their writes.
		// we can unblock the writer by replying immediately, but this doesn't buy much either since they can buffer their writes.

		obj.mu.Lock()
		ok = true

		obj.mu.Unlock()
		// replicate will also manage flushing
		g.Replicate <- obj
	}
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

// message in channels with wait groups and ids. (promise)

// one shard per ip address/core
// runs on its own port, so part of sessions. has its own apiset. does nbio let us single thread this though?
// maybe we should go from a global api to a queue to the user drain
type DeviceShard struct {
	global *GlobalState
	ZeusNode
	Session map[DeviceId]*WebsockSession // map device -> conn
	// allocation of pages to logs
	Page     []LogId
	Free     int32
	Mem      []int32
	LogState []LogState // randomly evict
	Cooling  uint32
}

// Copy implements ZeusMap.
func (*DeviceShard) Copy(node int, key main.KEY) {
	panic("unimplemented")
}

// Create implements ZeusMap.
func (*DeviceShard) Create(main.KEY) main.ZeusObject {
	panic("unimplemented")
}

// Pin implements ZeusMap.
func (*DeviceShard) Pin(main.KEY) (any, bool) {
	panic("unimplemented")
}

func (dev *DeviceShard) AllocateLog() LogId {
	return LogId(0)
}
func (dev *DeviceShard) FreeLog(l LogId, out *LogState) error {
	return
}

// eventually we should trim the out objects if they aren't homed here.

func (dev *DeviceShard) ReadLogState(l LogId, out *LogState) error {
	return nil
}
func (dev *DeviceShard) SetLogOwner(l LogId, d DeviceId) DeviceId {
	return d
}

func NewDeviceShard() *DeviceShard {
	return &DeviceShard{}
}

// one per websocket.
type WebsockSession struct {
	shard  *DeviceShard
	Conn   *websocket.Conn
	Iss    string
	Device DeviceId
	User   UserId
	Nonce  int64
	// authorization hash, this session has proved its authority on these logs
	Handle map[LogId]bool // map site.log -> read/write
}

// we only write to disk files that are homed in this shard. We only write to R2 files that are primary to this shard
func (d *DeviceShard) LogAffinity(l LogId) int {
	return int(l) % len(d.global.DeviceShard)
}

const PAGESIZE = 4096

func (g *GlobalState) Flush() {
	for {
		// only flush homed objects, R2 objects that are
		n := <-g.Unflushed
		if n.OldestUnflushed != n.Newest {
			f, e := os.OpenFile(fmt.Sprintf("%s%d", g.Home+"/log/", n.LogId), os.O_CREATE|os.O_WRONLY, 0644)
			if e != nil {
				continue
			}
			for n.OldestUnflushed != n.Newest {
				pg := n.OldestUnflushed

				f.WriteAt(g.Mem[pg*PAGESIZE:pg*(PAGESIZE+1)], int64(n.At)*PAGESIZE)
				n.At++
				n.OldestUnflushed = g.Next[n.OldestUnflushed]
			}
		}
	}
}

func (g *GlobalState) BroadCast(device []DeviceId, m []byte) {

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
	if err != nil {
		return nil, err
	}
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
	// the nonce starts at a random number and is incremented by one each time.
	m.AddRpc("lease", func(c context.Context, data []byte) (any, error) {
		var v struct {
			LogId     LogId `json:"log,omitempty"`
			Signature []byte
			Nonce     int64
			Write     bool
		}
		// we need to return a way to get a webrtc connection to the current leader.

		e := cbor.Unmarshal(data, &v)
		if e != nil {
			return nil, e
		}
		session := c.Value("session").(*WebsockSession)
		v.Nonce++
		if v.Nonce != session.Nonce {
			return nil, fmt.Errorf("invalid nonce")
		}

		var state LogState
		session.shard.ReadLogState(v.LogId, &state)
		// check the signature.
		CheckProof := func(key []byte) bool {
			plaintext := fmt.Sprintf("%d,%d", v.LogId, v.Nonce)
			_ = plaintext
			return true
		}
		var ok bool
		if v.Write {
			ok = CheckProof(state.WriteKey)
		} else {
			ok = CheckProof(state.ReadKey)
		}
		if !ok {
			return nil, fmt.Errorf("invalid signature")
		}
		for state.DeviceOwner == 0 {
			// try to set the owner to this device, can fail. If it fails we can retry the read
			state.DeviceOwner = session.shard.SetLogOwner(v.LogId, session.Device)
		}

		// read the log state from zeus
		// if there is a webrtc owner, then return that
		// note that the request and leaders may on different front ends
		// so we need our signaling to handle this.
		// if there isn't one, then make the caller the owner
		// we need to check the signatures
		// set the information into the cache for subsequent reads and writes.

		session.Handle[v.LogId] = true

		type LeaseInfo struct {
			Leader DeviceId
		}
		// maybe if the leader belongs to a different front end, the client should connect to that front end directly to signal the webrtc connection
		var li LeaseInfo = LeaseInfo{
			Leader: DeviceId(state.DeviceOwner),
		}
		//
		return &li, nil
	})
	// pass messages between nodes to facilitate webrtc connections
	// maybe we should use dedicated
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
			LogId LogId `json:"handle,omitempty"`
			From  int64 `json:"from,omitempty"`
		}
		e := cbor.Unmarshal(data, &v)
		if e != nil {
			return nil, e
		}
		var state LogState
		session := c.Value("session").(*WebsockSession)
		_, ok := session.Handle[v.LogId]
		if !ok {
			return nil, fmt.Errorf("invalid handle")
		}
		session.shard.ReadLogState(v.LogId, &state)

		return nil, nil
	})
	// merklesquare uses merkle squared log to add or revoke devices from a name
	m.AddRpc("m2write", func(c context.Context, data []byte) (any, error) {
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
	m.AddRpc("m2read", func(c context.Context, data []byte) (any, error) {
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
			LogId LogId  `json:"handle,omitempty"`
			At    int64  `json:"at,omitempty"`
			Data  []byte `json:"number,omitempty"`
		}
		e := cbor.Unmarshal(data, &v)
		if e != nil {
			return nil, e
		}
		session := c.Value("session").(*WebsockSession)
		h, ok := session.Handle[v.LogId]
		if !ok || !h {
			return nil, fmt.Errorf("handle not found")
		}
		// h.req <- Request{Session: session.device, Site: h.site, Log: h.log, At: v.At, Data: v.Data}
		cr := &ZeusLogTx{
			Op: ZtxWrite,
		}
		session.shard.ZeusNode.ClientReq <- cr

		return nil, nil
	})

	return r, nil
}

// adapt Zeus

// first replicate the tail state. start an async process to fsync to disk, then trim

// each DeviceShard has a buffer with linked entries it int.

const (
	ZtxRead = iota
	ZtxWrite
	ZtxTrim
	ZtxAddListener
	ZtxRemoveListener
)

type ZeusLogTx struct {
	keys []KEY
	Op   int
	At   []int64
	Data [][]byte
}

var _ ZeusTx = (*ZeusLogTx)(nil)

// Keys implements ZeusTx.
func (z *ZeusLogTx) Keys() []KEY {
	return z.keys
}

func (tx *ZeusLogTx) OnCommit(objects []ZeusObject) []byte {
	switch tx.Op {
	case ZtxRead:
		type ZeusLogRead struct {
			At []int64
		}

		type ZeusLogReadReply struct {
			DeviceOwner int64
			Data        []byte
		}

		break
	case ZtxWrite:
		fail := false
		for i := range objects {
			zo := objects[i].(*LogState)
			if tx.At[i] != zo.Length {
				fail = true
			}
		}
		if !fail {
			for i, at := range objects {
				zo := objects[i].(*LogState)
				if at == zo.Length {
					zo.Length += int64(len(tx.Data[i]))
					// this is too simplified, we need to write to the blob store
					// we need to notify listeners
					zo.Tail = append(zo.Tail, tx.Data[i]...)
				}
			}
		}
		type ZeusLogWriteReply struct {
			Ok bool
		}
		var r ZeusLogWriteReply = ZeusLogWriteReply{Ok: !fail}
		b, _ := cbor.Marshal(r)
		return b
	}
	return nil
}
