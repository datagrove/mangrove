package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/rs/cors"
)

type Message struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

var upgrader = websocket.Upgrader{}

func main() {
	// Create a new CORS handler
	c := cors.AllowAll()

	// Create a new HTTP handler with the CORS middleware
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", handleWebSocket)
	handler := c.Handler(mux)

	// Start the server
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade the HTTP connection to a WebSocket connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	for {
		// Read incoming message from the client
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			break
		}

		// Parse the message as a JSON object
		var msg Message
		err = json.Unmarshal(message, &msg)
		if err != nil {
			log.Println(err)
			continue
		}

		// Handle the message based on its type
		switch msg.Type {
		case "offer":
			// Handle offer message
			fmt.Println("Received offer:", msg.Data)
			// ...
		case "answer":
			// Handle answer message
			fmt.Println("Received answer:", msg.Data)
			// ...
		case "ice":
			// Handle ICE candidate message
			fmt.Println("Received ICE candidate:", msg.Data)
			// ...
		default:
			log.Println("Unknown message type:", msg.Type)
		}
	}
}
