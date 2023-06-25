package main

import (
	"github.com/datagrove/mangrove/ucan"
	"github.com/fxamacker/cbor/v2"
)

type ExecOpen struct {
	*LogShard
	c  Client
	tx RpcClient
}

func (ex *ExecOpen) Exec() {
	// unmarshal the params
	var open TxOpen
	c := ex.c
	tx := ex.tx
	lg := ex.LogShard
	cbor.Unmarshal(tx.Params, &open)

	canu := func(f *FileMeta, mode byte, did []byte) bool {
		return true
	}

	// look up the database
	a, ok := lg.State.obj.Get(open.FileId)
	if !ok {
		go func() {
			f, e := lg.db.GetFile(open.FileId)
			if e != nil {
				c.fail(tx.Id, e.Error())
				return
			}
			if !canu(f, open.Mode, c.did) {
				c.fail(tx.Id, "permission denied")
				return
			}
			c.reply(tx.Id, open.FileId)
		}()
		return
	}
	if a.PublicRights != 0 {
		payload, e := ucan.DecodeUcan(open.Ucan)
		if e != nil {
			c.fail(tx.Id, e.Error())
		}
		// the ucan must be valid to open this file in this mode
		// the file may be an cache or not
		if len(payload.Grant) != 1 {
			c.fail(tx.Id, "invalid ucan")
		}
		// payload.Grant[0].With
		// payload.Grant[0].Can
		// ok for now
	}
	c.reply(tx.Id, open.FileId)
}
