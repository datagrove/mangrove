package main

import (
	"github.com/cornelk/hashmap"
	"github.com/fxamacker/cbor/v2"
)

type StreamId = uint64
type SyncQuery struct {
	StreamId
	UserId
	LastSync int64
}
type SyncWatch struct {
	DeviceId
	StreamId
	LastRead int64 // -1 close?
}

type SyncEvent struct {
	StreamId
	Ts int64
}

// calculated by the owner and sent to

func (st *State) Notify(d DeviceId, s []StreamId) {
}

// doesn't need rpc id, this is global thing.
// we could stream if too big for one message
type SyncToClient struct {
	Method string
	Params []StreamId
}

type SyncState struct {
	stream hashmap.Map[StreamId, StreamState]
	// this might be better as a linked list? channels can fill up and block.
	in  chan DeviceId
	out chan DeviceId
	upd chan SyncEvent
}

// keep a replica of every stream in memory? is that practical?
// we could keep a cutoff for old streams, so if its not in memory then it hasn't been updated.

type StreamState struct {
	latest int64
	watch  map[DeviceId]bool
}

type NotifyEvent struct {
	DeviceId
	StreamId
}
type WatchEvent = NotifyEvent

func (st *State) Update() {

	upd := func(s []SyncEvent, openWatch []WatchEvent, closeWatch []WatchEvent) {
		var notify map[DeviceId][]StreamId
		note := func(d DeviceId, s StreamId) {
			notify[d] = append(notify[d], s)
		}
		// maybe for queries we can do one pass insert, then one pass remove?
		// use phase hash?
		for _, e := range s {
			// each stream id is in a cluster shard
			ss, ok := st.stream.Get(e.StreamId)
			if ok {
				ss.latest = e.Ts
				for k := range ss.watch {
					note(k, e.StreamId)
				}
			}
		}
		for _, e := range openWatch {
			ss, ok := st.stream.Get(e.StreamId)
			if ok {
				ss.watch[e.DeviceId] = true
			}
		}
		for _, e := range closeWatch {
			ss, ok := st.stream.Get(e.StreamId)
			if ok {
				delete(ss.watch, e.DeviceId)
			}
		}

		// this feels like it should be a prefix sum kinda thing?
		for d, s := range notify {
			// each device id is in a cluster shard
			dv, ok := st.ClientByDevice.Get(d)
			if ok {
				b, _ := cbor.Marshal(SyncToClient{
					Method: "notify",
					Params: s,
				})
				// if the queue backs up we need to disconnect so we don't block the entire server. Client will reconnect
				dv.conn.Send(b)
			}
		}

		// the sync tree is sorted by stream id
		// we do join merge where we can flow down the tree, cutting off old branches.
	}
	// pick up all the updates, grab the subscribe list for new devices and leaving devices.
	var in []DeviceId
	var out []DeviceId

}

func ExecSync(lg *LogShard, c *Client, rpcClient *RpcClient) {
	// read a file with stream ids in it. join it with the update tree compared to a date. batch.
}

func OpenWatch(lg *LogShard, c *Client, rpcClient *RpcClient) {
	// broadcast to peers: each reads a file with stream ids in it
	// added to the directory to
}
func CloseWatch(lg *LogShard, c *Client, rpcClient *RpcClient) {
	// broadcast to peers: each reads a file with stream ids in it
	// added to the directory to
}
