package viewstamp

import (
	"sync"

	"github.com/davecgh/go-spew/spew"
	"github.com/fxamacker/cbor/v2"
)

type StateMachine interface {
	Exec([]byte) error
	Checkpoint(path string) error
}

// how can our state machine take advantage of multiple threads?
const (
	Ovalid = iota
	Oinvalid
	Orequest
	Odrive
)

type Log interface {
	Length() int
	Append([]byte) error
}

type Peer interface {
	Send([]byte) error
}
type VrReplica struct {
	req          chan Request
	st           StateMachine
	peer         []Peer
	primary      int
	me           int
	viewNumber   int
	opNumber     int
	commitNumber int
	log          Log
	client       map[int64]*VrClientConnection
}

var _ Peer = (*VrReplica)(nil)

func (c *VrReplica) Send(data []byte) error {
	var v Request
	e := cbor.Unmarshal(data, &v)
	if e != nil {
		return e
	}
	c.req <- v
	return nil
}

type VrClientConnection struct {
	Peer
	RequestNumber int64
	Result        []byte
}

const (
	OpPrepare = iota
	OpPrepareOk
)

type Message struct {
	Op int8
}

func Exec(v *VrReplica, data []byte) ([]byte, error) {
	return nil, nil
}

type Request struct {
	client  Peer // if nil then this is a replica request
	payload any
}

func (v *VrReplica) Run() {
	for {
		m, ok := <-v.req
		if !ok {
			return
		}
		if m.client != nil {
			cl := m.payload.(*ClientMessage)
			clo, ok := v.client[cl.ClientId]
			if !ok {
				v.client[cl.ClientId] = &VrClientConnection{
					Peer:          m.client,
					RequestNumber: -1,
				}
			}
			if cl.RequestNumber == clo.RequestNumber {
				m.client.Send(clo.Result)
			}
			if cl.RequestNumber <= clo.RequestNumber {
				continue
			}
			if v.primary == v.me {
				// send prepare to next replica
			} else {
				// send to primary
			}
		}
		switch {

		}
	}
}

type ClientMessage struct {
	Op            cbor.RawMessage
	RequestNumber int64
	ClientId      int64
}

type VrClient struct {
	RequestNumber int
	Peer          []Peer
}

func (v *VrClient) Exec(data []byte) ([]byte, error) {
	return nil, nil
}

type ChannelPeer struct {
	out chan []byte
}

func NewChannelPeer() *ChannelPeer {
	return &ChannelPeer{
		out: make(chan []byte),
	}
}

func (c *ChannelPeer) Send(data []byte) error {
	c.out <- data
	return nil
}

func NewVrReplica(me int, peer []Peer) *VrReplica {
	return &VrReplica{
		req:          make(chan Request),
		st:           nil,
		peer:         peer,
		primary:      0,
		me:           me,
		viewNumber:   0,
		opNumber:     0,
		commitNumber: 0,
		log:          nil,
		client:       map[int64]*VrClientConnection{},
	}
}

func Test() {
	// create 3 replicas and 3 clients

	cp := make([]*VrReplica, 3)
	ci := make([]Peer, 3)
	pr := make([]*VrClient, 3)

	for i := 0; i < 3; i++ {
		cp[i] = NewVrReplica(i, ci)
		pr[i] = &VrClient{}
		ci[i] = cp[i]
	}
	for i := 0; i < 3; i++ {
		go cp[i].Run()
	}
	var wg sync.WaitGroup
	wg.Add(3)
	for i := 0; i < 3; i++ {
		go func(i int) {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				pr[i].Exec(nil)
			}
		}(i)
	}
	wg.Wait()

	for i := 0; i < 3; i++ {
		spew.Dump(cp[i])
	}

}
