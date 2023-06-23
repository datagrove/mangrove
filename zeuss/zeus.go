package seuss

import (
	"github.com/cornelk/hashmap"
	"github.com/fxamacker/cbor/v2"
	"sort"
	"sync"
	"time"
)

// single key specialization. using a single key we can shard them and not worry about locks.
// note that they need to be shuffled to get to a key shard from a device shard and back.
// alternately we can just try to execute them as fast as we get them as long as they are owned (common case)
// we can queue them to an owner ship thread if they are not.
// we need the objects on an entire machine to be seen as having the same state (owned, invalid, etc)
// commit protocol can be a little different.

type KEY int64
type ZeusObject any
type PeerId int

const (
	NoPeer = PeerId(-1)
)

type Tstamp struct {
	int64
	PeerId
}

type ZeusMap interface {
	Pin(KEY) (any, bool)
	Create(KEY) ZeusObject
	// copy from another node
	Copy(node int, key KEY)
}

const (
	O_valid = iota
	O_invalid
	O_request
	O_drive
)

// directories can shard directly on the key, like mica
type ZeusState struct {
	O_state int8 // valid, invalid, state, drive
	O_ts    Tstamp
	// Paper suggests a bit vector here
	O_replicas []PeerId
	O_owner    PeerId
	mu         sync.Mutex
}
type ZeusObj struct {
	ZeusState
	Obj any
}

type hashable interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 | ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr | ~float32 | ~float64 | ~string
}

type ZeusCommit1 func(KEY, any) []byte

type ZeusPeer struct {
	node []Peer
	dir  []Peer // a subset of node, there are only 3 directory nodes in the cluster (or world?)
}
type ZeusGlobalDir struct {
	ZeusPeer
}
type ZeusGlobal struct {
	ZeusPeer
	Me      PeerId
	Object  hashmap.Map[KEY, *ZeusObj]
	Cooling []ZeusObject
	// some peers are on the same machine, some are on websocket connections
	Slow   chan Pair
	Commit ZeusCommit1
}
type Pair struct {
	KEY
	any
}

func (g *ZeusGlobal) Run1(k KEY, m any) {
	obj, ok := g.Object.Get(k)
	if ok && obj.O_owner == g.Me {
		obj.mu.Lock()
		g.Commit(k, obj)
		obj.mu.Unlock()
		g.Replicate <- obj
	} else {
		g.Slow <- Pair{k, m}
	}
}

type ZeusNode struct {
	Req       chan ZeusMessage
	ClientReq chan ZeusTx
	Await     map[int32]*BlockedTx
}

func (z *ZeusGlobal) ClusterSend(id PeerId, data []byte) {
	z.node[int(id)].Send(data)
}
func (z *ZeusGlobal) DriverFor(id PeerId) PeerId {
	return PeerId(int(id) % len(z.dir))
}

type ZeusDir struct {
	Req chan []byte
	// map log to state in directory
	dir   map[KEY]*ZeusState
	notMe []PeerId
}

type BlockedTx struct {
	Waiting int
	Req     ZeusTx
}

const (
	REQ = iota
	ACK
	NACK
	INV
	VAL
)

type ZeusMessage struct {
	Id int32
	Op int8
	KEY
	Coordinator PeerId
}

type ZeusTx interface {
	Keys() []KEY
	OnCommit(objects []ZeusObject) []byte
}

func (g *ZeusGlobal) Run(z *ZeusNode) {
	var next = int32(0)
	exec := func(tx ZeusTx, objects []ZeusObject) {
		// make ourselves the owner of the objects
		tx.OnCommit(objects)
	}
	peer := func(v ZeusMessage) {
		switch v.Op {
		case REQ:
			panic("directory only")
		case ACK:
			// when we get all the acks we can commit
			tx, ok := z.Await[v.Id]
			if !ok {
				return
			}
			tx.Waiting--
			if tx.Waiting == 0 {
				exec(tx.Req, nil)
			}
		}
	}
	client := func(tx ZeusTx) {
		sort.Slice(tx.Keys(), func(i, j int) bool {
			return tx.Keys()[i] < tx.Keys()[j]
		})
		var need []KEY // not owner, or not even replica
		for _, k := range tx.Keys() {
			v, ok := g.Object.Get(k)
			if !ok {
				z.global.Object.Set(k, &ZeusState{})
				need = append(need, k)
			}

			if g.Me != v.O_owner {
				need = append(need, k)
				//state = append(have, Zeus)
			} else {
				//have = append(have, v)
				o := &ZeusState{
					O_state:    O_request,
					O_ts:       Tstamp{0, NoPeer},
					O_replicas: nil,
					O_owner:    z.Me,
				}
				z.global.Object.Set(k, o)
			}
		}
		// we need to get ownership of the objects
		if len(need) > 0 {
			for _, k := range need {
				// pick a driver, if we are collocated with one we should pick that.
				driver := z.DriverFor(z.Me)
				next++
				msg := ZeusMessage{
					Id:  next,
					Op:  REQ,
					KEY: k,
				}
				b, _ := cbor.Marshal(msg)
				z.ClusterSend(driver, b)
			}
		} else {
			// sort the objects by key so that we can't deadlock
			var v []ZeusObject
			for _, k := range tx.Keys() {
				o, _ := z.Replica.Pin(k)
				v = append(v, o)
			}
			exec(tx, v)
		}
	}

	for {
		select {
		case tx, ok := <-z.ClientReq:
			if !ok {
				return
			}
			client(tx)
		case msg, ok := <-z.Req:
			if !ok {
				return
			}
			peer(msg)
		}

	}
}
func (z *ZeusDir) Run() {
	for {
		m, e := <-z.Req
		if !e {
			return
		}
		var v ZeusMessage
		cbor.Unmarshal(m, &v)
		switch v.Op {
		case REQ:
			obj := z.dir[v.KEY]
			to := z.notMe

			// load from sqlite or create
			if obj == nil {
				obj = &ZeusState{
					O_state:    O_request,
					O_ts:       Tstamp{0, v.Coordinator},
					O_replicas: []PeerId{v.Coordinator},
					O_owner:    v.Coordinator,
				}
				z.dir[v.KEY] = obj
			} else {
				to = append(to, obj.O_owner)
			}
			obj.O_state = O_drive
			obj.O_ts = Tstamp{time.Now().UnixNano(), obj.O_ts.PeerId}
			msg := ZeusMessage{
				Id:          v.Id,
				Coordinator: v.Coordinator,
				Op:          INV,
				KEY:         v.KEY,
			}

			// send to other dirs and the owner if there is one

		}
	}
}

func (z *ZeusNode) Send(data ZeusMessage) error {
	z.Req <- data
	return nil
}
func (z *ZeusDir) Send(data []byte) error {
	z.Req <- data
	return nil
}

func (*ZeusDir) Exec([]byte) error {
	panic("unimplemented")
}

// checkpoint implements StateMachine.
func (*ZeusDir) Checkpoint(path string) error {
	panic("unimplemented")
}

type Peer interface {
	Send(data []byte) error
}

type ExecTakeover struct {
}
