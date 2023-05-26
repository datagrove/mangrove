package logdb

import (
	"os"
	"sync"
)

// reads logs from newest to newestRead
// we need a way to read snapshots. would snapshots be enough for mvp?
// snapshots can be in R2

//

// three files
// header pages; write in place
// overflow pages; append only
//

// create a queue that edge bases can use to share and order operations

// there will be a slot for each tuple, key identifies that.
// we can

type EncryptedPool interface {
	Update(key int64, delta ConsensusValueDelta)
}

type WriteAheadLog interface {
	Append(data [][]byte) error
}

type LogPage struct {
	// these should be unsafe pointer, accessed atomically
	lastWriteTime []uint64 // last write time
	lastWrite     []uint16 // last write position
	data          []byte
}

type LogFrame struct {
	LastChange uint64
	page       LogPage
}

// when a page fills we need to
// 1. freeze it
// 2. create a new page with a link to the old page
// 3. push the new delta to the slot.
type Pubsub struct {
	pf     *os.File
	Size   int
	wal    WriteAheadLog
	frame  []LogFrame
	mu     sync.Mutex
	listen map[int64]map[int64]func(*ScanResult)
	update chan []byte
	sync   chan SyncRequest
}

type SyncRequest struct {
	session  int64
	keys     []int64
	lastRead []uint64
	fn       func(data [][]byte)
}

type PubsubOptions struct {
}

func GetAll[T any](ch <-chan T, values []T) []T {
	values = values[:0]
	for {
		select {
		case value, ok := <-ch:
			if !ok {
				return values
			}
			values = append(values, value)
		default:
			return values
		}
	}
}

func (pb *Pubsub) frameFor(key int64) (*LogFrame, int) {
	return &pb.frame[key>>32], int(key & 0xffffffff)
}

func NewPubSub(dir string, opt *PubsubOptions) *Pubsub {
	r := &Pubsub{
		pf:     &os.File{},
		Size:   0,
		wal:    nil,
		frame:  []LogFrame{},
		mu:     sync.Mutex{},
		listen: map[int64]map[int64]func(*ScanResult){},
		update: make(chan []byte),
		sync:   make(chan SyncRequest),
	}

	sync := []SyncRequest{}
	waiting := []SyncRequest{}
	readPage := make(chan int64)
	go func() {
		for {
			o := <-readPage

		}
	}()

	syncBatch := func(sync []SyncRequest) {
		for _, req := range sync {
			o := [][]byte{}
			for _, key := range req.keys {
				lastRead := req.lastRead[key]
				f, sl := r.frameFor(key)
				if f.LastChange <= lastRead {
					continue
				}
				// read the page from disk if needed
				// use memory map instead?
				// best to request the page, and pend the request
				if len(f.page.data) == 0 {
					readPage <- key
				}
				if f.page.lastWriteTime[sl] <= lastRead {
					continue
				}
			}
			if len(o) > 0 {
				req.fn(o) // even if we pended the user will come back with a new request.
				return
			} else {
				waiting = append(waiting, req)
			}
		}
	}

	go func() {
		for {
			if len(sync) > 0 {
				syncBatch(sync)
			} else {
				syncBatch(waiting)
			}
		}
		sync = GetAll(r.sync, sync)

		// do some pargo parfor here

	}()

	batch := [][]byte{}
	go func() {
		for {
			batch = GetAll(r.update, batch)
			r.wal.Append(batch)

			// it would be nice at this point to do a pargo parfor
			// maybe sort by pages? should have already decoded it?
			// do we need authorization check here?
		}
	}()
	return r
}

func (q *Pubsub) Close() {

}
func (q *Pubsub) Push(session int64, key int64, delta ConsensusValueDelta) {
	//q.pool.Update(key, delta)
}

// calling a function here lets us avoid blocking, pushing to a channel makes that harder.
func (q *Pubsub) Listen(session int64, key []int64, do func(s *ScanResult)) {

}
func (q *Pubsub) Remove(session int64, key []int64) {

}

// we could use a websocket variant of long polling; our acknowlege could get us
// instead of session we could use device id, and then we could slot them too.

// each device has vector with their subscriptions
// we need to compare that to current tree of log pages aggregated by date
// we can keep an aggregation of pages that aren't in memory (they probably have not been updated)
