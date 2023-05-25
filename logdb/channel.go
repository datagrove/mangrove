package logdb

import (
	"github.com/fxamacker/cbor/v2"
	"github.com/gorilla/websocket"
)

// best effort, messages are only stored in memory
// is there any win to trying to do things like aeron here?
// our clients don't need a lot of concurrency, so probably not.

// like this we will fail potentially on every message?
// is a problem to use the api like this, should we make a different abstraction that reconnects automatically?

type OnMessage = func(bytes []byte)
type OnOffline func(bool)
type MessageChannel interface {
	// sends nil when the connection is closed from the other side
	Send(data []byte) error
	Close() error
}

type SocketChannel struct {
	conn     *websocket.Conn
	url      string
	listener OnMessage
	offline  OnOffline
}

var _ MessageChannel = (*SocketChannel)(nil)

func Dial(url string, credential cbor.RawMessage, listener OnMessage) (MessageChannel, error) {
	conn, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		return nil, err
	}
	go func() {
		defer conn.Close()
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				conn.Close()
				listener(nil)
				return
			}
			listener(message)
		}
	}()
	return &SocketChannel{
		conn: conn,
	}, nil
}

// Close implements MessageChannel
func (sc *SocketChannel) Close() error {
	return sc.conn.Close()
}

// what are the guarantees here? any? block until its on the server?
// Send implements MessageChannel
func (sc *SocketChannel) Send(data []byte) error {
	return sc.conn.WriteMessage(websocket.BinaryMessage, data)
}
