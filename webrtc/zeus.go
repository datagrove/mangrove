package main

import "github.com/fxamacker/cbor/v2"

type KEY int64

type KeyMap interface {
	Get(KEY) (ZeusObject, bool)
	Set(KEY, ZeusObject)
}
type ZeusCommit func(ZeusTx, []any) []byte
type ZeusObject interface {
	Unmarshal([]byte) error
	Marshal() ([]byte, error)
}
type SimplePeer struct {
	req chan []byte
}
type ZeusNode struct {
	SimplePeer
	dir  []Peer
	node []Peer

	object KeyMap

	Commit ZeusCommit
}

// nodes are sharded to threads, so no need to lock here?
func (z *ZeusNode) Exec(Key []KEY, op []byte) ([]byte, error) {

	return nil, nil
}

const (
	Zval = iota
	Zinval
	Zcommit // from client
)

type ZeusMessage struct {
	Peer    Peer
	Payload cbor.RawMessage
}
type ZeusTx struct {
	Key    []KEY
	Params cbor.RawMessage
}

func (z *ZeusNode) Run() {
	for {
		m, e := <-z.req
		if !e {
			return
		}
		var v ZeusMessage
		cbor.Unmarshal(m, &v)
		if v.Peer != nil {
			var tx ZeusTx
			cbor.Unmarshal(v.Payload, &tx)
			var need []KEY
			var have []any
			// need to get all the objects onto this node, hopefully we already own them.
			for _, k := range tx.Key {
				v, ok := z.object.Get(k)
				if !ok {
					need = append(need, k)
					have = append(have, nil)
				} else {
					have = append(have, v)
				}
			}
			if len(need) == 0 {
				b := z.Commit(tx, have)
				v.Peer.Send(b)
			}
		}
	}
}
func (z *ZeusDir) Run() {
	for {
		m, e := <-z.req
		if !e {
			return
		}
		var v ZeusMessage
		cbor.Unmarshal(m, &v)

	}
}

type ZeusDir struct {
	SimplePeer
	// map log to state in directory
	dir map[int64]*ZeusState
}

func (z *SimplePeer) Send(data []byte) error {
	z.req <- data
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
type ZeusState struct {
	O_state    int8
	O_ts       int64
	O_nd       int64
	O_replicas []int64
	O_peer     []Peer
}

type ExecTakeover struct {
}
