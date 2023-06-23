package main

import ()

type Cluster struct {
}

// each shard will have its own ring
// each machine in the group will send to the next machine in the ring

// will put on ring, but will be extracted by the target
func (cl *Cluster) Send(PeerId, []byte) {

}

// will be ordered on the ring, then upcall

func (cl *Cluster) Broadcast(data []byte, fn func()) {

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
	// cold is a blob store
	ColdLength int64
	// which nodes have a copy of the warm data
	WarmReplica []int64

	Listener map[DeviceId]int64
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

type Tx1 struct {
	LogId
	DeviceId
	Op    int8
	At    int64
	Data  []byte
	Locks []int64
}

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

type LogShard struct {
	inp   chan []Tx1
	out   chan []Io
	obj   map[LogId]*LogState
	pause map[LogId][]Tx1
}
type State struct {
	// state is a sharded hash table
	shard []LogShard

	// pages are a shared resource or allocated per shard?
}

func Run(st *State, lg *LogShard) {

	for p := range lg.inp {
		o := make([]Io, 0, 100)
		for _, tx := range p {
			// is it worth sorting by key, timestamp etc?
			obj, ok := lg.obj[tx.LogId]
			if !ok {
				lg.pause[tx.LogId] = append(lg.pause[tx.LogId], tx)

				continue
			}
			switch tx.Op {
			case Awrite:
				// client write to the object
				// this will generate sync to all the listeners
				// we need to create
			case Aclient_ack:
				if tx.At > obj.Listener[tx.DeviceId] {
					obj.Listener[tx.DeviceId] = tx.At
				}

			case Aflush_ack:
			}

		}
		lg.out <- o
	}
}
