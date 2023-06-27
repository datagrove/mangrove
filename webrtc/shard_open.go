package main

import (
	"github.com/datagrove/mangrove/ucan"
	"github.com/fxamacker/cbor/v2"
)

// type Payload struct {
// 	With struct {
// 		Scheme string
// 		HierPart string
// 	}
// 	Can struct {
// 		Namespace string
// 		Segments []string
// 	}
// }

// with: { scheme: "mailto", hierPart: "boris@fission.codes" },

// // `can` is an ability, which always has a namespace and optional segments.
// // → "msg/SEND"
// can: { namespace: "msg", segments: [ "SEND" ] }
// log id's are 32 bit database id + 32 bit serial number
// all of these share the same security, so we only need to open once.
type TxOpen struct {
	FileId // put in header so we can route without finishing the parsing.
	Ucan   string
	Mode   byte
	// create a file in one step
}

func ExecOpen(lg *LogShard, c *Client, tx *RpcClient) {
	// unmarshal the params
	var open TxOpen

	cbor.Unmarshal(tx.Params, &open)

	canu := func(f *SecurityPartition, mode byte, did []byte) bool {
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
