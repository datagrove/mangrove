package main

import (
	"bufio"
	"encoding/binary"
	"net"

	"github.com/datagrove/mangrove/push"
)

// each shard should allow its own ip address
type Cluster struct {
	// send  net.Conn
	// recv  net.Conn
	shard []Shard
	peer  []net.Conn
}

// there is a tcp connection between the same shard on each machine
func NewCluster(me int, peer []string, shard []Shard) (*Cluster, error) {
	pcn := make([]net.Conn, len(peer))
	listener, err := net.Listen("tcp", peer[me])
	if err != nil {
		panic(err)
	}
	defer listener.Close()

	// Accept incoming connections and handle them in separate goroutines
	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				// Handle the error
				continue
			}
			go func(conn net.Conn) {
				reader := bufio.NewReader(conn)
				b := make([]byte, 1)
				reader.Read(b)
				pcn[b[0]] = conn

				for {
					// Read the length of the message
					lengthBytes, err := reader.Peek(4)
					if err != nil {
						panic(err)
					}
					length := int32(lengthBytes[0])<<24 | int32(lengthBytes[1])<<16 | int32(lengthBytes[2])<<8 | int32(lengthBytes[3])

					// Read the message payload
					payload := make([]byte, length)
					_, err = reader.Read(payload)
					if err != nil {
						panic(err)
					}
				}

			}(conn)
		}
	}()

	for i, p := range peer {

	}
	return &Cluster{
		peer:  pcn,
		shard: shard,
	}, nil
}

func (cl *Cluster) Send(PeerId, []byte) {
	panic("implement me")
}

type Shard interface {
	Recv(PeerId, []byte)
}

func (cl *Cluster) epochChange() {
	panic("implement me")
}

// messages should be 32 bits of length, then 64 bits of logid
func (cl *Cluster) Run() {
	reader := bufio.NewReader(cl.conn)

	len := 0
	for {

		// Read the incoming connection into the buffer. does this block?
		reqLen, err := cl.recv.Read(buf)
		if err != nil {
			cl.epochChange()
		}
		if len > 0 {

			packet = append(packet, buf[:reqLen]...)
		}

	}
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

// will put on ring, but will be extracted by the target
func (cl *Cluster) Send(PeerId, []byte) {
	// start with length, then logid
	// we need to a bit to indicate if it is a broadcast or not
	// if its a broadcast we need to know where it started so we can replace it with an ack.

}

// will be ordered on the ring, then upcall

func (cl *Cluster) Broadcast(data []byte, fn func()) {

}

func (cl *Cluster) SendToPrimary(LogId, []byte) {

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
	Op   int8
	At   int64
	Data []byte
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

func (io *Io) Invalidate(tx *Tx1) {
}
func (io *Io) Validate(tx *Tx1) {
}

// each log shard manages it's own group commit
// each group commit must force certain pages to flush so that we don't write them twice
// record locks are expensive; they require io. Is it too expensive? should we force webrtc?
// we can cache, but if its not in memory that doesn't tell us anything.
type LogShard struct {
	client    chan []byte // client messages are routed to a target LogId without parsing.
	lowClient chan []byte // we may want to depriortize some logs
	inp       chan TxPeer
	sync      chan LogId
	out       chan Io
	obj       map[LogId]*LogState
	pause     map[LogId][]TxPeer

	GroupCommit [][]byte
	io          chan IoMsg
}
type IoMsg struct {
}
type State struct {
	Cluster
	push *push.NotifyDb

	// state is a sharded hash table
	shard []LogShard

	// pages are a shared resource or allocated per shard?
}

func NewState(home string) (*State, error) {
	// send to anyone online
	send := func(int64, []byte) error {
		return nil
	}
	db, err := push.NewNotifyDb(home, send)
	if err != nil {
		return nil, err
	}
	return &State{
		Cluster: Cluster{},
		push:    db,
		shard:   make([]LogShard, 16),
	}, nil
}

func Run(st *State, lg *LogShard) {

	ackToClient := func(tx Tx1) {
	}
	nackToClient := func(tx Tx1) {
	}

	invalToPeers := func(tx Tx1) {
	}
	valToPeers := func(tx Tx1) {
		// not enough information here?
		st.push.LogAppend(tx.LogId, tx.Data)
	}

	for tx := range lg.inp {
		// is it worth sorting by key, timestamp etc?
		obj, ok := lg.obj[tx.LogId]
		if !ok {
			lg.pause[tx.LogId] = append(lg.pause[tx.LogId], tx)

			continue
		}
		isPrimary := true
		if isPrimary {
			if tx.Continue {
				// tx is acknowledged by peers, now we can ack to client
				valToPeers(tx)
				ackToClient(tx)
				// publish to listeners

			} else {
				switch tx.Op {
				case Awrite:
					// client write to the object
					// we can write to the object, but cannot acknowledge to client until peers have acked
					// we need to create
					ok := false
					if !ok {
						nackToClient(tx)
					} else {
						invalToPeers(tx)
					}

				case Aclient_ack:
					// we can get away with only caching this in memory since there is little downside in extra sync messages
					if tx.At > obj.Listener[tx.DeviceId] {
						obj.Listener[tx.DeviceId] = tx.At
					}

				case Aflush_ack:
				}
			}
		}

	}

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
