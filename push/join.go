package push

// watch triggers need to travel back to their device shard
type WatchJoin struct {
	recent map[LogId]map[DeviceId]bool
	online map[DeviceId]bool

	mtime map[LogId]int64

	oldest int64
}

func (w *WatchJoin) Online(u DeviceId, sub []LogId, b bool) {
	for _, l := range sub {
		if b {
			w.recent[l][u] = true
		} else {
			delete(w.recent[l], u)
		}
	}

}

// background update
func (w *WatchJoin) UpdatedSince(u DeviceId, sub []LogId, read int64) []LogId {
	if read < w.oldest {
		return sub
	}
	w.online[u] = true
	r := make([]LogId, 0)
	for _, l := range sub {
		if w.mtime[l] > read {
			r = append(r, l)
		}
	}
	return r
}

func (w *WatchJoin) Update(l LogId, mtime int64) []DeviceId {
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
