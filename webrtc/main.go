package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/rs/cors"
)

// type Message struct {
// 	Type string          `json:"type"`
// 	Data json.RawMessage `json:"data"`
// }

// var upgrader = websocket.Upgrader{}

// var waiting []*websocket.Conn = make([]*websocket.Conn, 0)
// var sg sync.WaitGroup
// var mu sync.Mutex

// type SiteMap struct {
// 	mu     sync.Mutex
// 	site   sync.Map // map[int64]*Site
// 	device sync.Map // map[int64]*Device
// }

// var siteMap *SiteMap

// type Site struct {
// 	sync.Mutex
// 	lessee *websocket.Conn
// }

// build a cluster
func main() {

	siteMap = &SiteMap{
		mu:     mu,
		site:   sync.Map{},
		device: sync.Map{},
	}

	// Create a new CORS handler
	c := cors.AllowAll()
	sg.Add(2)
	// Create a new HTTP handler with the CORS middleware
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", handleWebSocket)
	handler := c.Handler(mux)

	// Start the server
	log.Printf("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

type Rpc struct {
	Method string          `json:"method,omitempty"`
	Id     int64           `json:"id,omitempty"`
	Params json.RawMessage `json:"params,omitempty"`
}

type RpcReply struct {
	Id     int64  `json:"id,omitempty"`
	Result any    `json:"result,omitempty"`
	Error  string `json:"error,omitempty"`
}

// defer conn.Close()
// mu.Lock()
// waiting = append(waiting, conn)
// x := len(waiting) - 1
// mu.Unlock()
// sg.Done()
// sg.Wait()
// cx := waiting[(x+1)%2]
// log.Printf("sending: %s,%d", message, x)
// cx.WriteMessage(websocket.TextMessage, message)
