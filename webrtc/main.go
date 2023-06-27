package main

import (
	"fmt"
	"log"
	"net/http"
)

// in addition to the cluster we want to start an embedded web server that is the editor.
// the editor should have access to other clusters as well as its home cluster

func StartPeer(home string, i int, outof int, core int) {

	host := make([]string, outof)
	for i := 0; i < len(host); i++ {
		host = append(host, fmt.Sprintf(":809%d", i))
	}

	cfg := &ClusterConfig{
		Me:           0,
		Peer:         []string{},
		Shard:        make([]Shard, core),
		Ws:           "",
		WsStart:      9000,
		PortPerShard: 0,
	}
	st, e := NewState(fmt.Sprintf("test%d", i), 10)
	if e != nil {
		panic(e)
	}

	shard := make([]Shard, 10)
	for i := range shard {
		shard[i] = st.shard[i]
	}
	cfg.Me = i
	cfg.Shard = shard

	NewCluster(cfg)
}

// build a cluster
func main() {

}

func ServeHttps() {

	// Create a new HTTP handler with the CORS middleware
	mux := http.NewServeMux()

	// Start the server
	log.Printf("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
