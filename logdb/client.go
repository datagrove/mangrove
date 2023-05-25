package logdb

import (
	"fmt"
	"sync"

	"github.com/fxamacker/cbor/v2"
)

// we need to keep an exclusive lock on the client interface while executing a transaction
// we must know the position is not changing, and that we don't create concurrency within a single session

// don't delete formats; overwrite the format the way you want
const (
	OpInsert = iota // only thing that changes positions, and only increases them
	OpDelete        // not exactly a delete, more of a format as hidden. positions don't change.
	OpFormat
)

type Node interface {
	Insert(begin int, value string)
	InsertBlock(begin, value cbor.RawMessage) Node
	Delete(begin, end int64)
	Style(begin, end int64, value cbor.RawMessage)
}

// each node is a key and a reference to the transaction being built
// we can use it to write updates to the node.
type NodeImpl struct {
	// we can register the node with the transaction
	// we we commit it we can retrieve all its changes.
	// do nodes have unique ids?

	functor []Functor
}

// Delete implements Node
func (*NodeImpl) Delete(begin int64, end int64) {
	panic("unimplemented")
}

// Insert implements Node
func (*NodeImpl) Insert(begin int, value string) {
	panic("unimplemented")
}

// InsertBlock implements Node
func (*NodeImpl) InsertBlock(begin cbor.RawMessage, value cbor.RawMessage) Node {
	panic("unimplemented")
}

// Style implements Node
func (*NodeImpl) Style(begin int64, end int64, value cbor.RawMessage) {
	panic("unimplemented")
}

var _ Node = (*NodeImpl)(nil)

type Transaction interface {
	GetRoot(cell Cell) Node
}
type TransactionImpl struct {
	//
}

// GetRoot implements Transaction
func (*TransactionImpl) GetRoot(cell Cell) Node {
	return &NodeImpl{}
}

// roughly a map of proposed values
// each values is an interval tree of formatting ranges
type ConsensusValueUpdate struct {
	Begin int64
	End   int64
	Op    int
	Data  []byte
}

// a functor updates a cell, so this can be OT?
type Functor struct {
	TableHandle  int
	UpdateKey    []byte
	UpdateColumn int
	UpdateValue  []ConsensusValueUpdate
}
type Tx struct {
	Session string
	Functor []Functor
}

// set of steps? we know that some steps need to be dropped
type CellState struct {
}

type Cell interface {
	State() CellState
	Update(func())
	Root() Node // why not pass this to update?
}
type CellImpl struct {
	state CellState
}

func (cs *CellImpl) State() CellState {
	return cs.state
}
func (cs *CellImpl) Update(fn func()) {
	fn()
}
func (cs *CellImpl) Root() Node {
	return Node(nil)
}

type TableDesc[Record any, Key any] struct {
	Name string
}

// we might need column specs as well? do we want to rely on reflection?
// not every language has it. dart for example
// this could be vector of cell states.
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

func (cr *ClientRange[Record, Key]) Wait() RangeState[Record] {
	cr.state = <-cr.wait
	return cr.state
}

type RangeState[Record any] struct {
	tuple Rope[Record]
	Size  int64 // for the entire begin:end, not regarding offset/limit
}

func (cr *RangeState[Record]) Changes(func(x, y int, c Cell)) {

}

func (rs *RangeState[Record]) Cell(column, row int64) Cell {
	return &CellImpl{}
}
func (rs *RangeState[Record]) Row(row int64) *Record {
	return nil
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
	mu    sync.Mutex
}

var _ Transaction = &TransactionImpl{}

func (cl *Client) Commit(fn func(ctx Transaction) error) error {
	ctx := &TransactionImpl{}
	return fn(ctx)
}

// we need generated code for correct types

// One connection to a local database, possibly in process. Possibly out of process but with shared memory.
// Client pretty dead in water if it loses connection, so maybe message channel should
// use keep alive or similar.
// maybe should be in it's own package?

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
	cl.mu.Lock()
	defer cl.mu.Unlock()
	cl.port.Close()
	return nil
}

// Commit implements ClientThread
func (cl *Client) SendCommit(method string, params interface{}) (interface{}, error) {
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
	cl.mu.Lock()
	var wg sync.WaitGroup
	var x *RpcResult
	wg.Add(1)
	cl.await[v.Id] = func(r *RpcResult) {
		x = r
		wg.Done()
	}
	cl.port.Send(b)
	cl.mu.Unlock()
	wg.Wait()
	cl.mu.Lock()
	delete(cl.await, v.Id)
	cl.mu.Unlock()
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

// this should allow tree shaking if you only need one of these.
func NewMemoryClient(opt *ClientOptions, more ...[]ClientModifier) (*Client, error) {
	// run's database in process taking requests over a go channel
	// all data is kept in memory
	x := &Client{
		port:  nil,
		next:  0,
		await: make(map[int64]func(*RpcResult)),
		mu:    sync.Mutex{},
	}
	return x, nil
}

func NewLocalClient(path string, opt *ClientOptions, more ...[]ClientModifier) (*Client, error) {
	// run's database in process taking requests over a go channe
	x := &Client{
		port:  nil,
		next:  0,
		await: make(map[int64]func(*RpcResult)),
		mu:    sync.Mutex{},
	}
	return nil, nil
}

func NewNetworkClient(url string, opt *ClientOptions, more ...[]ClientModifier) (*Client, error) {
	cl := &Client{}
	b, e := cbor.Marshal(&opt.Credential)
	if e != nil {
		return nil, e
	}
	cl.port, e = Dial(url, b, func([]byte) {
		var rpc RpcResult
		e = cbor.Unmarshal(b, &rpc)
		if e != nil {
			return
		}
		cl.mu.Lock()
		defer cl.mu.Unlock()
		f, ok := cl.await[rpc.Id]
		if ok {
			f(&rpc)
		}
		// mostly here we are unpacking delta's and apply them to ranges.
		// trigger listeners.
	})
	if e != nil {
		return nil, e
	}
	return cl, nil

}
