package main

import (
	"github.com/cornelk/hashmap"
	"github.com/fxamacker/cbor/v2"
)

// we should probably

type StreamId = uint64
type SyncEvent struct {
	DeviceId
	StreamId
	Ts int64
}

// outbound message, device id is implied.
type SyncNotify struct {
	StreamId
	Ts int64
}

// doesn't need rpc id, this is global thing.
// we could stream if too big for one message
type SyncToClient struct {
	Method string
	Params []SyncNotify // return the timestamp helps if the device is part way through a sync.
}

type SyncState struct {
	stream hashmap.Map[StreamId, StreamState]
	// this might be better as a linked list? channels can fill up and block.
	query chan []SyncEvent
	in    chan []SyncEvent
	out   chan []SyncEvent
	upd   chan SyncEvent
}
type StreamState struct {
	latest int64
	watch  map[DeviceId]bool
}

func (st *State) dv(dx DeviceId, ts int64) []SyncEvent {
	var res []SyncEvent
	sub := st.db.GetWatch(dx)
	for _, s := range sub {
		res = append(res, SyncEvent{dx, s, ts})
	}

	return res
}

func (st *State) addQuery(d DeviceId, ts int64) {
	st.query <- st.dv(d, ts)
}
func (st *State) addWatch(d DeviceId, ts int64) {
	st.in <- st.dv(d, ts)
}
func (st *State) removeWatch(d DeviceId) {
	st.out <- st.dv(d, 0)
}

// keep a replica of every stream in memory? is that practical?
// we could keep a cutoff for old streams, so if its not in memory then it hasn't been updated.

func (st *State) Update() {

	upd := func(
		appendEvent []SyncEvent,
		openWatch []SyncEvent,
		closeWatch []SyncEvent,
		query []SyncEvent,
	) {
		var notify map[DeviceId][]SyncNotify
		note := func(d DeviceId, s StreamId, ts int64) {
			notify[d] = append(notify[d], SyncNotify{s, ts})
		}
		// maybe for queries we can do one pass insert, then one pass remove?
		// use phase hash?
		for _, e := range appendEvent {
			// each stream id is in a cluster shard
			ss, ok := st.stream.Get(e.StreamId)
			if ok {
				if e.Ts > ss.latest {
					ss.latest = e.Ts
					for k := range ss.watch {
						note(k, e.StreamId, ss.latest)
					}
				}
			}
		}
		// there is a bug here, that we need to get the file from disk if it's not in memory. we should do that before this loop though.
		// we need a set read streams to update our set, and stream evictions to balance.
		for _, e := range query {
			ss, ok := st.stream.Get(e.StreamId)
			if ok && ss.latest > e.Ts {
				note(e.DeviceId, e.StreamId, ss.latest)
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

	// subscriptions - special table, or packed into vector?

	in := getVecFlat(st.in)
	out := getVecFlat(st.out)
	se := getVec(st.upd)
	q := getVecFlat(st.query)
	upd(se, in, out, q)
}

func getVecFlat[T any](from chan []T) []T {
	var res []T
	for {
		select {
		case v := <-from:
			res = append(res, v...)
		default:
			return res
		}
	}
}
func getVec[T any](from chan T) []T {
	var res []T
	for {
		select {
		case v := <-from:
			res = append(res, v)
		default:
			return res
		}
	}
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
