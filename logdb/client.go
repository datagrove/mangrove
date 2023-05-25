package logdb

import (
	"fmt"
	"sync"

	"github.com/fxamacker/cbor/v2"
)

// set of steps? we know that some steps need to be dropped
type CellState struct {
}
type Cell interface {
	State() CellState
	Update(func())
}
type SimpleCell struct {
}

func (cs *SimpleCell) update(fn func()) {
	fn()
}

type TableDesc[Record any, Key any] struct {
	Name string
}
type TableRangeSpec[Key any] struct {
	Begin  Key
	End    Key
	Offset int64
	Limit  int64
}

type ClientRange[Record any, Key any] struct {
	Server string
	Table  string
	wait   chan RangeState[Record]
	state  RangeState[Record]
}

func (cr *ClientRange[Record, Key]) Wait() {
	cr.state = <-cr.wait
}

type RangeState[Record any] struct {
	tuple Rope[Record]
	Size  int64 // for the entire begin:end, not regarding offset/limit
}

func (cr *ClientRange[Record, Key]) Update(tr TableRangeSpec[Key]) error {
	return nil
}

func Select[Key any](a, b Key, c, d int64) TableRangeSpec[Key] {
	return TableRangeSpec[Key]{
		Begin:  a,
		End:    b,
		Offset: c,
		Limit:  d,
	}
}

func Open[Record any, Key any](serverSite string, desc TableDesc[Record, Key], sel TableRangeSpec[Key]) *ClientRange[Record, Key] {
	return &ClientRange[Record, Key]{}
}

type Client struct {
	port  MessageChannel
	next  int64
	await map[int64]func(*RpcResult)
}

// we need generated code for correct types

// One connection to a local database, possibly in process. Possibly out of process but with shared memory.
// Client pretty dead in water if it loses connection, so maybe message channel should
// use keep alive or similar.
// maybe should be in it's own package?
var mu sync.Mutex
var global_client *Client
var counter int

type Rpc struct {
	Method string          `json:"method,omitempty"`
	Id     int64           `json:"id,omitempty"`
	Params cbor.RawMessage `json:"params,omitempty"`
}
type Rpcx struct {
	Method string `json:"method,omitempty"`
	Id     int64  `json:"id,omitempty"`
	Params any    `json:"params,omitempty"`
}
type RpcResult struct {
	Id     int64 `json:"id,omitempty"`
	Result any
	Error  string `json:"params,omitempty"`
}

// Close implements ClientThread
func (cl *Client) Close() error {
	mu.Lock()
	defer mu.Unlock()
	counter--
	if counter == 0 {
		cl.port.Close()
		global_client = nil
	}
	return nil
}

// Commit implements ClientThread
func (cl *Client) Commit(method string, params interface{}) (interface{}, error) {
	v := Rpcx{
		Method: method,
		Id:     cl.next,
		Params: params,
	}
	cl.next++
	b, e := cbor.Marshal(&v)
	if e != nil {
		return nil, e
	}
	mu.Lock()
	var wg sync.WaitGroup
	var x *RpcResult
	wg.Add(1)
	cl.await[v.Id] = func(r *RpcResult) {
		x = r
		wg.Done()
	}
	cl.port.Send(b)
	mu.Unlock()
	wg.Wait()
	mu.Lock()
	delete(cl.await, v.Id)
	mu.Unlock()
	if x.Result != nil {
		return x.Result, nil
	} else {
		return nil, fmt.Errorf(x.Error)
	}
}

/*
type ClientThreadImpl struct {

// Close implements ClientThread
func (*ClientThreadImpl) Close() error {
	return global_client.Close()
}

// Commit implements ClientThread
func (*ClientThreadImpl) Commit(method string, args interface{}) (interface{}, error) {
	return global_client.Commit(method, args)
}

// Open implements ClientThread
func (*ClientThreadImpl) Open(rg *RangeSpec, onchange func()) (*ClientRange, error) {
	return global_cl
}
var _ ClientThread = &ClientThreadImpl{}
*/

type ClientOptions struct {
	Credential
	Package []Package
}
type ClientModifier = func(c *Client) error

// this client assumes that it will be connected to a Database
// the Database could be running locally, in which case the message channel will
// be a go channel, otherwise it could be a websocket or DataChannel
func NewClient(url string, opt *ClientOptions, more ...[]ClientModifier) (*Client, error) {
	// depending on the url we may start a server here
	// there should not be more than one server per process
	mu.Lock()
	defer mu.Unlock()
	if global_client != nil {
		return global_client, nil
	}
	b, e := cbor.Marshal(&opt.Credential)
	if e != nil {
		return nil, e
	}
	ch, e := Dial(url, b, func([]byte) {
		var rpc RpcResult
		e = cbor.Unmarshal(b, &rpc)
		if e != nil {
			return
		}
		mu.Lock()
		defer mu.Unlock()
		f, ok := global_client.await[rpc.Id]
		if ok {
			f(&rpc)
		}
		// mostly here we are unpacking delta's and apply them to ranges.
		// trigger listeners.
	})
	if e != nil {
		return nil, e
	}
	global_client, e = &Client{
		port: ch,
	}, nil
	return global_client, nil
}
