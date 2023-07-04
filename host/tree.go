package main

import (
	"net/http"

	"github.com/cornelk/hashmap"
)

func Send() {

}

// Is it practical to read a published file system built in a log like this? we may need to do it efficiently to answer queries from bots in particular who may not bother with service worker.
type Directory interface {
}

// the hybrid log must be flushed before completion of the leanstore commit. "sometimes force"
type HybridLog struct {
}

// each entry can be identified by its commit timestamp.
// these entries are immutable, as such we don't need to read them with zeus.
type Host struct {
	Name         string
	Id           int64 // use to read the log. alternate key.
	Head         int64
	HomeRegion   string
	BackupRegion string
	// R2 is also a backup; if we lose one replica we immediately flush to R2 and eventually rebuild the lost node.

	// if we are owner we may be
}
type Zeus struct {
	obj *hashmap.Map[string, *Host]
}
type Dgx struct {
	write *HybridLog
	read  *HybridLog
}
type LogCache struct {
}

func ReadLog() {

}

func getPage(z *Zeus, w http.ResponseWriter, r *http.Request) {
	site := r.Host
	path := r.URL.Path

	// get the root sstable for host, either out of the cache, or we can become a replica
	// we are not a replica then we must become one
	readKey := func(s []byte) {
	}

	readKey([]byte(site))
}
