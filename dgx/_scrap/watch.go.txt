package main

// watch triggers need to travel back to their device shard
type WatchJoin struct {
	recent map[FileId]map[DeviceId]bool
	online map[DeviceId]bool

	mtime map[FileId]int64

	oldest int64
}

func (w *WatchJoin) Online(u DeviceId, sub []FileId, b bool) {
	for _, l := range sub {
		if b {
			w.recent[l][u] = true
		} else {
			delete(w.recent[l], u)
		}
	}

}

// background update
func (w *WatchJoin) UpdatedSince(u DeviceId, sub []FileId, read int64) []FileId {
	if read < w.oldest {
		return sub
	}
	w.online[u] = true
	r := make([]FileId, 0)
	for _, l := range sub {
		if w.mtime[l] > read {
			r = append(r, l)
		}
	}
	return r
}

func (w *WatchJoin) Update(l FileId, mtime int64) []DeviceId {
	w.mtime[l] = mtime
	a, ok := w.recent[l]
	if !ok {
		// read the subscribers from disk. If necessary evict the oldest file to make room
		return nil
	}
	var r []DeviceId
	for d, _ := range a {
		r = append(r, d)
	}
	return r
}
