package main

import (
	"encoding/binary"

	"github.com/datagrove/mangrove/push"
	"github.com/fxamacker/cbor/v2"
)

type LogId = int64
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
type LogShard struct {
	client    chan []byte // client messages are routed to a target LogId without parsing.
	lowClient chan []byte // we may want to depriortize some logs
	inp       chan []byte
	sync      chan LogId
	out       chan Io
	capped    map[LogId]bool
	obj       map[LogId]*LogState
	pause     map[LogId][]*TxPeer

	GroupCommit [][]byte
	io          chan IoMsg
}

// ClientRecv implements Shard.
func (sh *LogShard) ClientRecv(data []byte) {
	sh.client <- data
}

var _ Shard = (*LogShard)(nil)

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
type LogState struct {
	LogId
	WriteKey    []byte // people with
	ReadKey     []byte
	DeviceOwner DeviceId // connect using webrtc.
	Length      int64
	Newest      uint32 // when it fills, assign next, increment unflushed
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

type TxBase struct {
	Id int64 // used in replies, acks etc. unique nonce
	LogId
	StreamId int32 // maybe 24 bits
	Op       int8
	At       int64
	Data     []byte
}

type TxClient struct {
	TxBase
	Handle int64
	Author DeviceId   // reply to, saves latency? not necessary?
	PushTo []DeviceId // @joe, @jane, @bob, doesn't need to be replicated.
}
type TxPeer struct {
	TxBase
	// locks are too expensive here, and in the common case are not needed.
	//Locks    []int64
	Continue bool
}

// the push is encrypted on client, we can't read it.
// we still need to write this to the log, for backup.
// type TxPush struct {
// 	LogId     // use for permissions? generally is logid of the dm channel
// 	From DeviceId  // use to filter out sender. don't alert sender
// 	DeviceId  // 0 = everyone, too annoying?
// 	Payload   []byte
// }

// a hypervariable that maintains a buffer for each thread
const (
	Opeer_send = iota
	Oclient_send
	Oflush_req
	Oread_log
)

type Io struct {
}

// each log shard manages it's own group commit
// each group commit must force certain pages to flush so that we don't write them twice
// record locks are expensive; they require io. Is it too expensive? should we force webrtc?
// we can cache, but if its not in memory that doesn't tell us anything.

type IoMsg struct {
}

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

func NewShard(st *State, id int) (*LogShard, error) {

	lg := LogShard{}

	fromPeer := func(data []byte) {
		var tx TxPeer
		cbor.Unmarshal(data, &tx)
		// sending invalidate to peers could simply be the same packet
		ackToClient := func(tx *TxPeer) {
		}
		nackToClient := func(tx *TxPeer) {
		}

		invalToPeers := func(tx *TxPeer) {
			st.Broadcast(data)
		}
		valToPeers := func(tx *TxPeer) {
			// not enough information here?

		}
		ioLoad := func(tx *TxPeer) {
			lg.pause[tx.LogId] = append(lg.pause[tx.LogId], tx)
		}

		obj, ok := lg.obj[tx.LogId]
		_ = obj
		if !ok {
			ioLoad(&tx)
			return
		}
		isPrimary := true
		if isPrimary {
			if tx.Continue {
				// tx is acknowledged by peers, now we can ack to client
				valToPeers(&tx)
				ackToClient(&tx)
				// publish to listeners

			} else {
				switch tx.Op {
				case Awrite:
					// client write to the object
					// we can write to the object, but cannot acknowledge to client until peers have acked
					// we need to create
					ok := false
					if !ok {
						nackToClient(&tx)
					} else {
						invalToPeers(&tx)
					}

				case Aflush_ack:
				}
			}
		}

	}

	fromClient := func(data []byte) {
		var tx TxClient
		cbor.Unmarshal(data, &tx)

	}

	go func() {
		for {
			select {
			// case <-st.ctx.Done():
			// 	return
			case tx := <-lg.client:
				fromClient(tx)
			case tx := <-lg.inp:
				fromPeer(tx)
			}
		}
	}()
	return &lg, nil
}

type ClientState struct {
}

// each transaction should begin with 8 byte LogId, so we don't need to parse it multiple times.
func (g *State) ProcessClient(cs *ClientState, data []byte) {
	if len(data) >= 8 {
		logid := binary.LittleEndian.Uint64(data[:8])
		g.SendToPrimary(LogId(logid), data)
	}
}
