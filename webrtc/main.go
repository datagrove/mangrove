package main

import (
	"encoding/json"
	"log"
	"net/http"
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

func main() {
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

// this needs to send it to the the other connection
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade the HTTP connection to a WebSocket connection
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()
	mu.Lock()
	waiting = append(waiting, conn)
	x := len(waiting) - 1
	mu.Unlock()
	sg.Done()
	sg.Wait()
	for {
		// Read incoming message from the client
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			break
		}
		log.Printf("received: %s,%d", message, x)

		// Parse the message as a JSON object
		var msg Message
		err = json.Unmarshal(message, &msg)
		if err != nil {
			log.Println(err)
			continue
		}
		cx := waiting[(x+1)%2]
		log.Printf("sending: %s,%d", message, x)
		cx.WriteMessage(websocket.TextMessage, message)

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
