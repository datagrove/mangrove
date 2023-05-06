package fileserver

import (
	"io/fs"
	"log"
	"os"
	"sync"

	"github.com/datagrove/mangrove/ucan"
	"github.com/fsnotify/fsnotify"

	"github.com/datagrove/mangrove/server"
)

// can we manage a client that wants only state transfer?
type Watch struct {
	mu sync.Mutex

	Path    string
	Session map[*server.Session]int64
	Dir     map[string]fs.DirEntry
}

// there can be different kinds of file watchers; some can be time based
type DbDiff struct {
	column []TableDiff
	from   uint64
	to     uint64
}
type TableDiff struct {
	name   string // fully qualified
	op     int
	column []ColumnDiff
}
type ColumnDiff struct {
}

type WatcherNotify interface {
	Notify(handle int64, update *DbDiff) error
}

// most watchers are going to need a secret to encrypt data into the database
// this is probably a ucan, but can we stick a secret in a ucan? maybe should be a ucan/secret pair.

type DbCredential = []byte

// watchers act as agents for the client to watch things and update the database
// the client then watches the database.
type Watcher interface {
	// resources in ucan are json
	Add(access *ucan.Payload, cred *DbCredential) (int64, error)
	Drop(access *ucan.Payload) error
}

type FileWatcher struct {
	muwatch sync.Mutex
	Watch   map[string]*Watch
	Watcher *fsnotify.Watcher
}

func NewFileWatcher() *FileWatcher {
	return &FileWatcher{
		muwatch: sync.Mutex{},
		Watch:   map[string]*Watch{},
		Watcher: &fsnotify.Watcher{},
	}
}

// snapshot is empty unless From is too old.
type LogDiff struct {
	Snapshot []byte   // this only gives us a root of the btree (prolly tree?)
	Entry    [][]byte // these can just be copied from the log encrypted
	From     int64
	To       int64
}

// a special log filler. Watch a directory and write into the log or vice versa
type DirWatcher struct {
	Dir string
}

func (d *DirWatcher) Events() {

}

type WatchState struct {
	Dir []FileState `json:"dir,omitempty"`
}
type FileState struct {
	Name    string `json:"name,omitempty"`
	IsDir   bool   `json:"is_dir,omitempty"`
	Size    int64  `json:"size,omitempty"`
	ModTime int64  `json:"mod_time,omitempty"`
}

func (w *Watch) State() (*WatchState, error) {
	r := &WatchState{
		Dir: []FileState{},
	}
	for _, v := range w.Dir {
		fi, e := v.Info()
		if e != nil {
			continue
		}
		r.Dir = append(r.Dir, FileState{
			Name:    v.Name(),
			IsDir:   v.IsDir(),
			Size:    fi.Size(),
			ModTime: fi.ModTime().Unix(),
		})
	}

	return r, nil
}
func (w *Watch) Notify(ev fsnotify.Event) {
	w.mu.Lock()
	defer w.mu.Unlock()
	// notify the sessions
	for s, key := range w.Session {
		var j struct {
			Handle int64  `json:"handle,omitempty"`
			Path   string `json:"path,omitempty"`
			Op     string `json:"op,omitempty"`
		}
		j.Handle = key
		j.Path = ev.Name
		j.Op = ev.Op.String()
		s.Notifier.Notify(key, &j)
	}
}
func (s *FileWatcher) GetWatch(watchPath string) (*Watch, bool) {
	s.muwatch.Lock()
	defer s.muwatch.Unlock()
	w, ok := s.Watch[watchPath]
	if !ok {
		return nil, false
	}
	return w, true
}
func (s *FileWatcher) RemoveWatch(watchPath string, session *server.SocketSession) {
	w, ok := s.GetWatch(watchPath)
	if !ok {
		return
	}
	defer w.mu.Unlock()
	if ok {
		delete(w.Session, session)
		if len(w.Session) == 0 {
			s.Watcher.Remove(watchPath)
			delete(s.Watch, watchPath)
		}
	}
}

// func (s *Server) RemoveWatch(watchPath string, session *Session) {
// 	w, ok := s.GetWatch(watchPath)
// 	if !ok {
// 		return
// 	}
// 	defer w.mu.Unlock()
// 	if ok {
// 		delete(w.Session, session)
// 		if len(w.Session) == 0 {
// 			s.Watcher.Remove(watchPath)
// 			delete(s.Watch, watchPath)
// 		}
// 	}
// }

func (s *FileWatcher) AddWatch(watchPath string, handle int64, filter string, lastState int64) (*WatchState, error) {
	s.muwatch.Lock()
	defer s.muwatch.Unlock()
	w, ok := s.Watch[watchPath]
	if ok {
		w.mu.Lock()
		defer w.mu.Unlock()

		return w.State()
	}
	wd, e := os.ReadDir(watchPath)
	if e != nil {
		return nil, e
	}
	wdm := make(map[string]fs.DirEntry)
	for _, v := range wd {
		wdm[v.Name()] = v
	}

	if s.Watcher == nil {
		s.Watcher, e = fsnotify.NewWatcher()
		if e != nil {
			return nil, e
		}

		// use goroutine to start the watcher
		go func() {
			for {
				select {
				case event := <-s.Watcher.Events:
					// monitor only for write events
					if event.Op&fsnotify.Write == fsnotify.Write {
						w, ok := s.GetWatch(watchPath)
						if ok {
							w.Notify(event)
						}
					}
				case err := <-s.Watcher.Errors:
					log.Println("Error:", err)
				}
			}
		}()
	}
	e = s.Watcher.Add(watchPath)
	if e != nil {
		log.Print(e)
	}
	w = &Watch{
		mu:      sync.Mutex{},
		Path:    watchPath,
		Session: map[*server.Session]int64{},
		Dir:     wdm,
	}

	s.Watch[watchPath] = w

	return w.State()
}
