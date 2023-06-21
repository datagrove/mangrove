package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/rs/cors"
)

type Message struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

var upgrader = websocket.Upgrader{}

var waiting []*websocket.Conn = make([]*websocket.Conn, 0)
var sg sync.WaitGroup
var mu sync.Mutex

type SiteMap struct {
	mu     sync.Mutex
	site   sync.Map // map[int64]*Site
	device sync.Map // map[int64]*Device
}

var siteMap *SiteMap

type Device struct {
	sync.Mutex
	*websocket.Conn
}

type Site struct {
	sync.Mutex
	lessee *websocket.Conn
}

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

// this needs to send it to the the other connection
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade the HTTP connection to a WebSocket connection
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	id := r.URL.Query().Get("id")
	n, _ := strconv.Atoi(id)

	device := &Device{Conn: conn}
	siteMap.device.Store(n, device)

	for {
		// Read incoming message from the client
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			break
		}
		log.Printf("received: %s,%d", message, n)

		// Parse the message as a JSON object
		var msg Rpc
		err = json.Unmarshal(message, &msg)
		if err != nil {
			log.Println(err)
			continue
		}
		fail := func(s string) {
			reply := RpcReply{
				Id:    msg.Id,
				Error: s,
			}
			b, _ := json.Marshal(reply)
			conn.WriteMessage(websocket.TextMessage, b)
		}
		_ = fail
		ok := func(s any) {
			reply := RpcReply{
				Id:     msg.Id,
				Result: s,
			}
			b, _ := json.Marshal(reply)
			conn.WriteMessage(websocket.TextMessage, b)
		}
		switch msg.Method {
		case "open":
			// either return the current lessee or set the lessee to this connection
			var params struct {
				Id    int64  `json:"id"`
				Offer string `json:"offer"`
			}
			err = json.Unmarshal(msg.Params, &params)
			if err != nil {
				log.Println(err)
				continue
			}
			s, _ := siteMap.site.LoadOrStore(params.Id, &Site{})
			site := s.(*Site)
			site.Lock()
			if site.lessee == nil {
				site.lessee = conn
				ok(true)
			} else {
				// send the offer to the lessee
				ok(false)
				site.lessee.WriteMessage(websocket.TextMessage, msg.Params)
			}
		case "to":
			var params struct {
				Id int64 `json:"id"`
				// offer itself needs some auth information in it.
				// we need some rate limiting here
				Offer string `json:"offer"`
			}
			err = json.Unmarshal(msg.Params, &params)
			if err != nil {
				log.Println(err)
				continue
			}
			d, _ := siteMap.device.Load(params.Id)
			device := d.(*Device)
			device.Conn.WriteMessage(websocket.TextMessage, msg.Params)

			// Handle the message based on its type
			// switch msg.Type {
			// case "offer":
			// 	// Handle offer message
			// 	fmt.Println("Received offer:", msg.Data)
			// 	// ...
			// case "answer":
			// 	// Handle answer message
			// 	fmt.Println("Received answer:", msg.Data)
			// 	// ...
			// case "ice":
			// 	// Handle ICE candidate message
			// 	fmt.Println("Received ICE candidate:", msg.Data)
			// 	// ...
			// default:
			// 	log.Println("Unknown message type:", msg.Type)
			// }
		}
	}
}
