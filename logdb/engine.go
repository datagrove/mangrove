package logdb

import (
	"bytes"
	"encoding/binary"
	"os"
	"sync"
)

type Rpca struct {
	Method string
	Id     int64
	Params any
}
type RpcaResult struct {
	Id    int64
	Reply any
	Error error
}
type Engine struct {
	mu          sync.Mutex
	store       FileStore
	f           File
	remote      map[string]MessageChannel
	rootPage    RootPage
	root        int // 0 or 1, alternates on each group commit
	nextSession int
	listen      map[int]*Site
	ch          chan func(e *Engine)
}
type Site struct {
	listen map[*Session]bool
}
type Session struct {
	cred   Credential
	engine *Engine
	ch     chan *RpcaResult
}

func (h *Engine) Open(cred Credential) (*Session, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	r := &Session{
		cred:   cred,
		engine: h,
		ch:     make(chan *RpcaResult),
	}

	return r, nil
}

type RootPage struct {
	Time   uint64
	Root   uint64
	Filler [510]uint64
}

// we can read all into memory.
type TableEntry struct {
	ServerSiteTableColumn uint64
	Url                   string
}

// primary keys can all be 64 bits
// secondary keys can be recovered from log, although we can't get too far behind

// if maintain a counter per sst we can keep the primary key dense.
type LogEntry2 struct {
	// begin key
	ServerSiteTable uint64 // putting column here is going to have column organization?
	PrimaryKey      uint64
	Column          uint32
	Session         uint64
	// end key, begin value
	Begin   uint32 // maybe part of key?
	End     uint32
	Op      byte
	Payload []byte //
	// what about computing the aggregate?

}

func (l *LogEntry2) Write()

func NewEngine(store FileStore, fn CustomFunction) (*Engine, error) {
	f, e := os.OpenFile("log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if e != nil {
		return nil, e
	}
	var page = make([]byte, 8192)
	r := &Engine{
		mu:          sync.Mutex{},
		store:       store,
		f:           f,
		remote:      map[string]MessageChannel{},
		rootPage:    RootPage{},
		root:        0,
		nextSession: 0,
		listen:      map[int]*Site{},
		ch:          make(chan func(e *Engine), 255),
	}
	// recover our state from the store, or generate a new one
	// connect to our servers and synchronize
	st, e := store.Stat("log")
	if e != nil || st.Size() == 0 {
		// the first two pages are alternate roots
		var page = make([]byte, 4096)
		f.WriteAt(page, 0)
		f.WriteAt(page, 4096)
		// make some initial transactions to initialize the catalog

	} else {
		var rp [2]RootPage
		f.ReadAt(page, 0)
		binary.Read(bytes.NewReader(page[0:4096]), binary.LittleEndian, &rp[0])
		binary.Read(bytes.NewReader(page[4096:8192]), binary.LittleEndian, &rp[1])
		if rp[0].Time > rp[1].Time {
			r.root = 0
		} else {
			r.root = 1
		}
		r.rootPage = rp[r.root]
	}

	go func() {
		for {
			tx := <-r.ch
			tx(r)
			for len(r.ch) > 0 {
				tx = <-r.ch
				tx(r)
			}
			// process batch
			r.rootPage.Root = 0

			// commit and shift root
			r.root = 1 - r.root
			f.Seek(int64(4096*r.root), 0)
			binary.Write(f, binary.LittleEndian, r.rootPage)
			f.Sync()
		}
	}()

	return r, nil
}

//
