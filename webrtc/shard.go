package main

import (
	"github.com/datagrove/mangrove/push"
	"github.com/datagrove/mangrove/sqlite/dglite"
)

type FileId = int64
type PeerId = int64
type ShardId = int64
type DeviceId = int64

type State struct {
	Cluster
	push *push.NotifyDb

	// state is a sharded hash table
	shard []*LogShard

	// pages are a shared resource or allocated per shard?
}
type Packet struct {
	conn ClientConn
	data []byte
}
type LogShard struct {
	client    chan Packet // client messages are routed to a target LogId without parsing.
	lowClient chan []byte // we may want to depriortize some logs
	inp       chan []byte
	sync      chan FileId
	out       chan Io

	// maybe it's users we should cap
	// do we need to identify the user or just the device?
	// generally our ucan will be dba -> user -> device
	// should we capture that user did?
	capped map[FileId]bool

	obj   map[FileId]*FileState
	pause map[FileId][]*TxPeer

	GroupCommit    [][]byte
	io             chan func()
	txid           int64
	ClientByDevice map[DeviceId]*Client
	ClientByConn   map[ClientConn]*Client
	cluster        *ClusterShard
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

func NewState(home string, shards int) (*State, error) {
	// send to anyone online
	send := func(int64, []byte) error {
		return nil
	}
	db, err := push.NewNotifyDb(home, send)
	if err != nil {
		return nil, err
	}
	r := &State{
		Cluster: Cluster{},
		push:    db,
		shard:   make([]*LogShard, shards),
	}
	for i := range r.shard {
		b, e := NewShard(r, i)
		if e != nil {
			panic(e)
		}
		r.shard[i] = b
	}

	return r, nil
}

func (lg *LogShard) Connect(cl *ClusterShard) {
	lg.cluster = cl
}
func NewShard(st *State, id int) (*LogShard, error) {
	lg := LogShard{}

	// will need some database opening and recovery here

	go func() {
		for {
			select {
			// case <-st.ctx.Done():
			// 	return
			case tx := <-lg.client:
				lg.fromWs(tx.conn, tx.data)
			case tx := <-lg.inp:
				lg.fromPeer(tx)
			}
		}
	}()
	return &lg, nil
}

type ClientState struct {
}

func GetFile(lg *LogState, id FileId) *FileState {
	dglite.Queries.
	return lg.obj[id]
}