package main

import (
	"sync"
	"sync/atomic"

	"github.com/cornelk/hashmap"
	"github.com/datagrove/mangrove/push"
)

type FileId = uint64
type TupleId = int64
type PeerId = int
type ShardId = int64
type DeviceId = int64

// key material is complex, we want to "own" a prefix, is it always first 48 bits?
// We always need the FileId. There is a small namespace bit vector, but irrelevant here. Some fileids are reserved. Some tupleids are reserved to indicate a message specific to a device (like a rekey notification).

type Gkey = uint64

type State struct {
	SyncState
	home string
	Cluster
	push *push.NotifyDb

	// state is a sharded hash table
	shard []*LogShard
	db    *LogDb
	obj   hashmap.Map[FileId, FileState]
	tuple hashmap.Map[Gkey, *TupleState]
	// pages are a shared resource or allocated per shard?

	// devices connected to this peer
	ClientByDevice hashmap.Map[DeviceId, Client]
}

const (
	O_valid = iota
	O_invalid
	O_request
	O_drive
)

type OwnerTimestamp = uint64 // 32 bit object version + 32 bit timestamp
type TupleState struct {
	mu      sync.RWMutex
	o_ts    OwnerTimestamp
	o_state int8
	// o_replicas, for now all nodes are considered replicas
	data [][]byte // this wouldn't be in directory node, but here converged owner.
}
type Packet struct {
	conn ClientConn
	data []byte
}
type Key = string // composite file+rowid
type DirRpc struct {
	key   Key
	reply func([]byte)
}
type Directory struct {
	*State
	cluster *ClusterShard
	rpc     chan DirRpc
}

// shards can act as directories, stores, or proxies
type LogShard struct {
	Directory
	client    chan Packet    // client messages are routed to a target LogId without parsing.
	clientP   chan TxClientP // txclient sent to the designated shard
	lowClient chan []byte    // we may want to depriortize some logs
	inp       chan []byte
	sync      chan FileId
	_txid     int64

	ClientByConn map[ClientConn]*Client
	// remember the client writer device so we can notify them of completed writes
	replyTo map[int64]DeviceId

	// maybe it's users we should cap
	// do we need to identify the user or just the device?
	// generally our ucan will be dba -> user -> device
	// should we capture that user did?
	//capped map[FileId]bool
	//GroupCommit [][]byte

	// high 2 bytes indicating global shard id
	start uint64
	end   uint64
}

// each core has its own sequence generator that it owns so ownershp always succeeds and no locks.
func (s *LogShard) NewRowId(f FileId) Gkey {
	if s.start == s.end {

	}
	r := s.start
	s.start++
	return Gkey(r)
}

func (lg *LogShard) NextTxId() int64 {
	return atomic.AddInt64(&lg._txid, 1)
}

var _ Shard = (*LogShard)(nil)

// ClientRecv implements Shard.
func (sh *LogShard) ClientRecv(conn ClientConn, data []byte) {
	sh.client <- Packet{conn, data}
}

func (sh *LogShard) Recv(id PeerId, data []byte) {
	sh.inp <- data
}

// each shard will have its own ring
// each machine in the group will send to the next machine in the ring

type Header struct {
	length int32
	logid  uint64
	sender PeerId
	// increment the ack count for the sender when the message reaches its final target. we can remove the message and send in the header of the next one, or in a heartbeat if there is no available message. (latency though?)
	ackCount []uint64
	payload  []byte
}
type TxClientP struct {
	*Client
	*RpcClient
}

// another tail latency issue with pargo style servers is that we have constant gc pressure?
type FileState struct {
	FileId
	PublicRights int
	WriteKey     []byte // people with
	ReadKey      []byte
	DeviceOwner  DeviceId // connect using webrtc.
	Length       int64
	Newest       uint32 // when it fills, assign next, increment unflushed
	// when we want to claim pages we start with the oldest
	Oldest          uint32
	At              uint32
	OldestUnflushed uint32
	BytesToday      int64
	ByteCap         int64
	// cold is a blob store
	ColdLength int64
	// which nodes have a copy of the warm data
	WarmReplica []int64

	Listener  map[DeviceId]int32
	Watermark int
	// ephemeral, use to not spam updates to the user.
	Sent map[DeviceId]Sent
}
type Sent struct {
	Length int64
	At     int64
}

// input can start with a vector of byte vectors that need to be parsed.
// or maybe we use unsafe go to simply access them in situ?
const (
	// writes are directed a coordinator shared according to its id.
	Awrite = iota
	// the device will make large writes to its own log, then attempt to move them into the main log.
	Aclient_temp_write
	Aclient_temp_move
	// client acknowledges a sync
	Aclient_ack
	// io thread acknowledges a flush request
	Aflush_ack
	AInval     // invalidates the log, but also appends to it.
	AVal       // validates the log, make recovery faster.
	AInval_ack // acks an invalidation, when we get all of them we can send Aval
)

// we can get this tx back after sending it to our peers.

// the push is encrypted on client, we can't read it.
// we still need to write this to the log, for backup.
// type TxPush struct {
// 	LogId     // use for permissions? generally is logid of the dm channel
// 	From DeviceId  // use to filter out sender. don't alert sender
// 	DeviceId  // 0 = everyone, too annoying?
// 	Payload   []byte
// }

func NewState(home string, cfg *ClusterConfig) (*State, error) {
	// send to anyone online
	send := func(int64, []byte) error {
		return nil
	}
	db, err := push.NewNotifyDb(home, send)
	if err != nil {
		return nil, err
	}
	p := home + "/log.sqlite"
	dbx, err := NewLogDb(p)
	if err != nil {
		return nil, err
	}

	r := &State{
		home:    home,
		Cluster: Cluster{},
		push:    db,
		db:      dbx,
		shard:   make([]*LogShard, cfg.cores),
	}
	for i := range r.shard {
		b, e := NewShard(r, i)
		if e != nil {
			panic(e)
		}
		r.shard[i] = b
	}
	shard := make([]Shard, 10)
	for i := range shard {
		shard[i] = r.shard[i]
	}
	r.Cluster.Init(shard, cfg)
	return r, nil
}

type Invalidate struct {
	FileId
	TupleId

	Data []byte
}

const (
	Cl_ack = iota
	Cl_inv
	Cl_val

	// for now Cl_req is not used, because every peer is already a directory
)

func (lg *LogShard) Req(tid TupleId) {

}

func (lg *LogShard) Connect(cl *ClusterShard) {
	lg.cluster = cl
	cl.method = make([]func(int, []byte), 256)
	cl.method[Cl_ack] = func(peerid int, data []byte) {
		// I don't think I need this, this should be a reply to the r-inv
	}
	cl.method[Cl_inv] = func(peerid int, data []byte) {
		// invalidate tells the file/tuple 128 bit id we are invalidating and the data that invalidates it. we want to be able to append, and to use logrithmic coallescing if necessary.
		// the object has already been updated when this message is sent, but not visible until we get the ack of the inv.

	}
	cl.method[Cl_val] = func(peerid int, data []byte) {

	}
}
func NewShard(st *State, id int) (*LogShard, error) {

	lg := LogShard{
		Directory:    Directory{State: st, cluster: &ClusterShard{}, rpc: make(chan DirRpc)},
		client:       make(chan Packet),
		clientP:      make(chan TxClientP),
		lowClient:    make(chan []byte),
		inp:          make(chan []byte),
		_txid:        0,
		ClientByConn: map[ClientConn]*Client{},
		replyTo:      map[int64]int64{},
		start:        0,
		end:          0,
	}

	// will need some database opening and recovery here

	go func() {
		for {
			select {
			// case <-st.ctx.Done():
			// 	return
			case tx := <-lg.client:
				lg.fromWs(tx.conn, tx.data)
			case tx := <-lg.inp:
				// peer?
				_ = tx
			}
		}
	}()
	return &lg, nil
}
