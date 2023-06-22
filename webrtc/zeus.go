package main

import (
	"time"

	"github.com/fxamacker/cbor/v2"
)

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

type ZeusState struct {
	O_state int8 // valid, invalid, state, drive
	O_ts    Tstamp
	// Paper suggests a bit vector here
	O_replicas []PeerId
	O_owner    PeerId
}

type ZeusCommit func(ZeusTx, []any) []byte

type ZeusGlobal struct {
	// some peers are on the same machine, some are on websocket connections
	node []Peer
	dir  []Peer // a subset of node, there are only 3 directory nodes in the cluster (or world?)
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
	dir map[KEY]*ZeusState
}

// not sure if we need this?

type ZeusNode struct {
	Req       chan ZeusMessage
	ClientReq chan ZeusTx
	*ZeusGlobal
	Replica ZeusMap
	Commit  ZeusCommit
	Local   map[KEY]*ZeusState
	Me      PeerId
	Await   map[int32]*BlockedTx
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

func (z *ZeusNode) Run() {
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

		var need []KEY // not owner, or not even replica
		for _, k := range tx.Keys() {
			v, ok := z.Local[k]
			if !ok {
				need = append(need, k)
			} else if z.Me != v.O_owner {
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
				z.Local[k] = o
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
			// object doesn't exist, create it all the arbiters
			if obj == nil {
				obj = &ZeusState{
					O_state:    O_request,
					O_ts:       Tstamp{0, v.Coordinator},
					O_replicas: []PeerId{v.Coordinator},
					O_owner:    NoPeer,
				}
				z.dir[v.KEY] = obj
			}
			tn := time.Now().UnixNano()
			obj.O_ts = Tstamp{tn, obj.O_ts.PeerId}

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
