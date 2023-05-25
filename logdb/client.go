package logdb

import "sync"

// Client pretty dead in water if it loses connection, so maybe message channel should
// use keep alive or similar.
// maybe should be in it's own package?

type Client struct {
	port MessageChannel
	// fields go here

}

var mu sync.Mutex
var global_client *Client

type ClientThread interface {
}

// this client assumes that it will be connected to a Database
// the Database could be running locally, in which case the message channel will
// be a go channel, otherwise it could be a websocket or DataChannel
func NewClient(url string, cred []byte) (ClientThread, error) {

	// depending on the url we may start a server here
	// there should not be more than one server per process

	ch, e := Dial(url, cred, func([]byte) {
		// mostly here we are unpacking delta's and apply them to ranges.
		// trigger listeners.
	})
	if e != nil {
		return nil, e
	}
	global_client = &Client{
		port: ch,
	}, nil
}
