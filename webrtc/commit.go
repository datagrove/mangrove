package main

import (
	"fmt"
	"sync"

	"github.com/fxamacker/cbor/v2"
)

// can we make it easier to restart by using this, or just add memory pressure?
type TxExecution struct {
	*LogShard
	*RpcClient

	Id    int64
	wg    sync.WaitGroup
	write TxCommit
}

func ExecTx(lg *LogShard, c *Client, rpc *RpcClient) {
	ex := &TxExecution{
		LogShard:  lg,
		RpcClient: rpc,
	}
	cbor.Unmarshal(rpc.Params, &ex.write)
	// pick a unique tx id.
	ex.Id = lg.txid
	lg.txid++
	if ex.tryAgain() {
		go func() {
			ex.wg.Wait()
			// can we do better than start completely over here?
			// maybe we can grow the lockset?
			for ex.tryAgain() {
				ex.wg.Wait()
			}
		}()
	}
}

// we don't care about rifl here, because the version will be bumped so a repeat will fail. the client will merge, and see its the same and not send.
type TxCommit struct {
	FileId
	// row id of 0 means to insert and return a new row id
	Read    []int64
	RowId   []int64
	Version []int64
	Data    [][]byte
	// if all versions are trimmed, the tuple is deleted
	Trim []int64
}
type TxResult struct {
	error string
	Read  [][]byte
	RowId []int64
}

// change these to fork and lock for database reads
// run read in their own thread since they may block on io.
func (lg *LogShard) Read(fid int64, rid int64) ([][]byte, error) {
	key := fmt.Sprintf("%d:%d", fid, rid)
	tp, ok := lg.tuple.Get(key)
	if ok {
		return tp.data, nil
	}
	// read from the database, get ownership first
	return nil, nil
}

func (lg *TxExecution) tryAgain() bool {
	var wait bool
	var ok bool
	write := lg.write

	// we get ownership all the versions of the tuple
	getOwnership := func(fileid FileId, rowid int64, tpl *TupleState) {
		wait = true
		lg.wg.Add(1)
		go func() {
			lg.wg.Done()
		}()
	}
	getValid := func(fileid FileId, rowid int64, tpl *TupleState) {
		wait = true
		lg.wg.Add(1)
		go func() {
			lg.wg.Done()
		}()
	}

	var tpl []*TupleState = make([]*TupleState, len(write.RowId))

	for i, rowid := range write.Read {
		key := fmt.Sprintf("%d:%d", write.FileId, rowid)
		tpl[i], ok = lg.tuple.Get(key)
		if !ok {
			// we need ownership so we can swap the tuple in.
			getOwnership(write.FileId, rowid, nil)
		}
		// we need the tuple to be valid
		if tpl[i].o_state != O_valid {
			getValid(write.FileId, rowid, tpl[i])
		}
	}

	for i, rowid := range write.RowId {
		if rowid == 0 {
			rowid = lg.NewRowId()
			key := fmt.Sprintf("%d:%d", write.FileId, rowid)
			tpl[i] = &TupleState{
				o_state: O_valid,
			}
			lg.tuple.Set(key, tpl[i])
		} else {
			key := fmt.Sprintf("%d:%d", write.FileId, rowid)
			tpl[i], ok = lg.tuple.Get(key)

			if !ok {
				// since we are also a directory, if the key is not in our cache, then it's not in any peer's cache. We can get it out of the database and own it. If it doesn't exist, we can create it. We can send invalidate/validate to all the directories to ensure that we own it. We might need to evict another tuple to make room for this one.
				tpl[i] = &TupleState{
					o_state: O_valid,
				}
				lg.tuple.Set(key, tpl[i])
				getOwnership(write.FileId, rowid, nil)
			} else {
				getOwnership(write.FileId, rowid, tpl[i])
			}
		}
	}
	return wait
}
