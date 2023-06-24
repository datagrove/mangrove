package main

import "github.com/fxamacker/cbor/v2"

// a hypervariable that maintains a buffer for each thread
const (
	Opeer_send = iota
	Oclient_send
	Oflush_req
	Oread_log
)

// header can be 8 bytes, 4 for length, 2 for cpu, 2 for epoch
// zeus uses timestamp to decide races. here there are no races, other than potentially epoch.
// converting to
type Invalid struct {
	TxId  int64 // used to ack
	LogId int64
	At    int64
	Data  []byte
}
type Valid struct {
	TxId  int64
	LogId int64
	At    int64
}
type Io struct {
}

// each log shard manages it's own group commit
// each group commit must force certain pages to flush so that we don't write them twice
// record locks are expensive; they require io. Is it too expensive? should we force webrtc?
// we can cache, but if its not in memory that doesn't tell us anything.

type IoMsg struct {
}

func (lg *LogShard) fromPeer(data []byte) {
	var tx TxPeer
	cbor.Unmarshal(data, &tx)
	// sending invalidate to peers could simply be the same packet
	ackToClient := func(tx *TxPeer) {
	}
	nackToClient := func(tx *TxPeer) {
	}

	// invalidate both gives the peer the data and tells them not to use it. We'll follup with a validate
	invalToPeers := func(tx *TxPeer) {
		i := Invalid{
			TxId:  tx.Id,
			LogId: tx.FileId,
			At:    tx.At,
			Data:  tx.Data,
		}
		data, _ := cbor.Marshal(i)
		lg.cluster.Broadcast(data)
	}
	valToPeers := func(tx *TxPeer) {
		// not enough information here?

	}
	ioLoad := func(tx *TxPeer) {
		lg.pause[tx.FileId] = append(lg.pause[tx.FileId], tx)
	}

	obj, ok := lg.obj[tx.FileId]
	_ = obj
	if !ok {
		ioLoad(&tx)
		return
	}
	isPrimary := true
	if isPrimary {
		if tx.Continue {
			// tx is acknowledged by peers, now we can ack to client
			valToPeers(&tx)
			ackToClient(&tx)
			// publish to listeners

		} else {
			switch tx.Op {
			case Awrite:
				// client write to the object
				// we can write to the object, but cannot acknowledge to client until peers have acked
				// we need to create
				ok := false
				if !ok {
					nackToClient(&tx)
				} else {
					invalToPeers(&tx)
				}

			case Aflush_ack:
			}
		}
	}

}
