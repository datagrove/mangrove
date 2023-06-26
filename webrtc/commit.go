package main

import (
	"fmt"
	"sort"
	"time"

	"github.com/fxamacker/cbor/v2"
)

// what about a replace owner operation? what about key rotation?
// read the file ids from a -2 page?
// type RtxInvalidate struct {
// 	Txid int64
// 	FileId
// 	At int64 // -1 means append
// 	// data is not in the header, but is the payoad
// }

// // validate will trigger a reply on the peer that initiated the write.
// type RtxValidate struct {
// 	Txid int64
// 	At   int64
// }

// func (v RtxInvalidate) toBytes() []byte {
// 	const sz = int(unsafe.Sizeof(RtxInvalidate{}))
// 	var asByteSlice []byte = (*(*[sz]byte)(unsafe.Pointer(&v)))[:]
// 	return asByteSlice
// }

// can we make it easier to restart by using this, or just add memory pressure?
type TxExecution struct {
	*LogShard
	*RpcClient

	Id      int64
	write   TxCommit
	backoff time.Duration
}

func ExecTx(lg *LogShard, c *Client, rpc *RpcClient) {
	ex := &TxExecution{
		LogShard:  lg,
		RpcClient: rpc,
	}
	cbor.Unmarshal(rpc.Params, &ex.write)
	// pick a unique tx id.
	ex.Id = lg.NextTxId()
	if ex.tryAgain() {
		go func() {
			ex.backoff = 100 * time.Millisecond
			// use back off algorithm to wait and retry.
			for retry := 1; retry < 10; retry++ {
				time.Sleep(ex.backoff)
				ex.backoff *= 2
			}
		}()
	}
}

// we don't care about rifl here, because the version will be bumped so a repeat will fail. the client will merge, and see its the same and not send.
type TxCommit struct {
	FileId
	// row id of 0 means to insert and return a new row id
	Op []TxOp
}

// a Functor is a byte packed edit instruction for the tuple bytes or blind append.
type TxOp struct {
	Gkey
	Functor []byte
	Version int64 // optional, 0 = don't care
}
type Functor struct {
	Literal  []bool
	StartEnd []uint64
	Data     []byte
}

// we can varint length bit vector 1=copy, 0=literal
// we can have varints for the start and end
// we can have length for the literal with appended bytes.

type FunctorOp struct {
}

type TxResult struct {
	error string
	Read  [][]byte
	RowId []int64
}

// change these to fork and lock for database reads
// run read in their own thread since they may block on io.
// func (lg *LogShard) Read(fid int64, rid int64) ([][]byte, error) {
// 	key := fmt.Sprintf("%d:%d", fid, rid)
// 	tp, ok := lg.tuple.Get(key)
// 	if ok {
// 		return tp.data, nil
// 	}
// 	// read from the database, get ownership first
// 	return nil, nil
// }

func (lg *ClusterShard) getOwnership(fileid FileId, rowid int64, tpl *TupleState) {

}
func (lg *ClusterShard) getValid(fileid FileId, rowid int64, tpl *TupleState) {

}

// we can retry the entire transaction if we fail on a key.
func (lg *TxExecution) tryAgain() bool {
	var wait bool
	var ok bool
	write := lg.write

	// we get ownership all the versions of the tuple
	// to get ownership we need to use the directory
	// sorting avoids deadlock.
	sort.Slice(write.Op, func(i, j int) bool {
		return string(write.Op[i].Gkey.data[:]) < string(write.Op[j].Gkey.data[:])
	})
	var tpl []*TupleState = make([]*TupleState, len(write.Op))

	// first pass just try to lock; if any are not local then do a pass of getting ownership of needed keys
	var need []Gkey = make([]Gkey, 0)
	for i, op := range write.Op {
		if op.Gkey.Insert() {
			rowid := lg.NewRowId(op.FileId())
			tpl[i] = &TupleState{
				o_state: O_valid,
			}
			lg.tuple.Set(rowid.String(), tpl[i])
		} else {
			key := fmt.Sprintf("%d:%d", write.FileId, op.RowId)
			tpl[i], ok = lg.tuple.Get(key)
			if !ok {
				// we need ownership so we can swap the tuple in.
				lg.getOwnership(write.FileId, op.RowId, nil)
			}
			// we need the tuple to be valid
			if tpl[i].o_state != O_valid {
				lg.getValid(write.FileId, op.RowId, tpl[i])
			}
		}

		key := fmt.Sprintf("%d:%d", write.FileId, op.RowId)
		tpl[i], ok = lg.tuple.Get(key)
		if !ok {
			// we need ownership so we can swap the tuple in.
			lg.getOwnership(write.FileId, op.RowId, nil)
		}
		// we need the tuple to be valid
		if tpl[i].o_state != O_valid {
			lg.getValid(write.FileId, op.RowId, tpl[i])
		}
	}

	return wait
}
