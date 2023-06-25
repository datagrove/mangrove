package main

import (
	"fmt"
	"sync"
)

// can we make it easier to restart by using this, or just add memory pressure?
type TxExecution struct {
	*LogShard
	Id  int64
	txc *TxCommit
}

func (ex *TxExecution) Exec() {

	// pick a unique tx id.
	tx.Id = lg.txid
	lg.txid++

	var wg sync.WaitGroup
	var wait bool

	// we get ownership all the versions of the tuple
	getOwnership := func(fileid FileId, rowid int64, tpl *TupleState) {
		wait = true
		wg.Add(1)
		go func() {
			wg.Done()
		}()
	}
	getValid := func(fileid FileId, rowid int64, tpl *TupleState) {
		wait = true
		wg.Add(1)
		go func() {
			wg.Done()
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
	if wait {
		go func() {
			wg.Wait()
			// can we do better than start completely over here?
			// maybe we can grow the lockset?
			lg.client <- Packet{conn, data}
		}()
	} else {
		// if no waits then we alread own all the tuples we need

	}
}
