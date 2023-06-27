package main

import (
	"crypto/rand"
	"crypto/sha256"
	"net/http"
	"sync"

	"github.com/cornelk/hashmap"
	"github.com/datagrove/mangrove/ucan"
	"github.com/fxamacker/cbor/v2"

	"context"
	"flag"
	"fmt"

	"os"
	"os/signal"
	"time"

	"github.com/lesismal/nbio/nbhttp"
	"github.com/lesismal/nbio/nbhttp/websocket"
)

// is it faster to get ownership from a shard on the same peer? zeus says it uses locking locally to get ownership

// the websock proxy is going to suck a lot of energy.
// we should try a goroutine per connection? that would give us single threaded access without locking.
type Client struct {
	sync.Mutex
	challenge [16]byte
	did       []byte
	conn      ClientConn
	handle    hashmap.Map[FileId, byte]
	state     int8
}

func (c *Client) reply(id int64, result any) {
	type Reply struct {
		Id     int64
		Result any
	}
	b, _ := cbor.Marshal(&Reply{id, result})
	c.conn.Send(b)
}

func (c *Client) fail(id int64, err string) {
	type Fail struct {
		Id  int64
		Err string
	}
	b, _ := cbor.Marshal(&Fail{id, err})
	c.conn.Send(b)
}

// client will send op +
const (
	OpOpen = iota
	OpCommit
	OpRead
	OpWatch
	OpSync
)

type RpcClient struct {
	Op     byte
	Id     int64 // used in replies, acks etc. unique nonce
	Params cbor.RawMessage
}

func (lg *LogShard) ApproveConnection(c *Client, data []byte) bool {
	type Login struct {
		Did       string `json:"did,omitempty"`
		Signature []byte `json:"signature,omitempty"`
	}
	var login Login
	cbor.Unmarshal(data, &login)
	hsha2 := sha256.Sum256([]byte(login.Did))
	// data must be an answer to the challenge. The Did must be valid for this shard
	x := int(hsha2[0]) % lg.cluster.NumShards()
	if x != lg.cluster.GlobalShard() {
		return false
	}
	ok := ucan.VerifyDid(c.challenge[:], login.Did, login.Signature)
	if !ok {
		return false
	}
	c.did = []byte(login.Did)
	return true
	// notify the push engine that the device is online
}

// we should have a special flag to connect for background update
func (lg *LogShard) ClientConnect(conn ClientConn) {
	cx := &Client{
		conn:   conn,
		handle: hashmap.Map[FileId, byte]{},
	}

	_, err := rand.Read(cx.challenge[:])
	if err != nil {
		panic(err)
	}
	conn.Send(cx.challenge[:])
	lg.ClientByConn[conn] = cx
}
func (lg *LogShard) fromWs(conn ClientConn, data []byte) {
	// note this exists because we created it in connect.
	c, ok := lg.ClientByConn[conn]
	if !ok {
		conn.Close()
		return
	}
	if c.state == 0 {
		if !lg.ApproveConnection(c, data) {
			conn.Close()
		}
		c.state = 1
		return
	}
	var tx RpcClient
	cbor.Unmarshal(data, &tx)
	switch tx.Op {
	// this could be a read only transaction.
	case OpOpen: // open can be pipelined. it loads the file into the approved map. each tuple accessed in a commit checks this map.
		ExecOpen(lg, c, &tx)
	case OpWatch:
		OpenWatch(lg, c, &tx)
	case OpSync:
		ExecSync(lg, c, &tx)
	case OpCommit:
		ExecTx(lg, c, &tx)
	}
}

/*
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

	device := &ClientConn{Conn: conn}
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
}*/

type WebsocketConn struct {
	conn *websocket.Conn
}

// Close implements ClientConn.
func (w *WebsocketConn) Close() {
	w.conn.Close()
}

var _ ClientConn = (*WebsocketConn)(nil)

func (c *WebsocketConn) Send(data []byte) {
	c.conn.Write(data)
}

var (
	onDataFrame      = flag.Bool("UseOnDataFrame", false, "Server will use OnDataFrame api instead of OnMessage")
	errBeforeUpgrade = flag.Bool("error-before-upgrade", false, "return an error on upgrade with body")
)

func newUpgrader() *websocket.Upgrader {
	u := websocket.NewUpgrader()
	if *onDataFrame {
		u.OnDataFrame(func(c *websocket.Conn, messageType websocket.MessageType, fin bool, data []byte) {
			// echo
			c.WriteFrame(messageType, true, fin, data)
		})
	} else {
		u.OnMessage(func(c *websocket.Conn, messageType websocket.MessageType, data []byte) {
			// echo
			c.WriteMessage(messageType, data)
		})
	}

	u.OnClose(func(c *websocket.Conn, err error) {
		fmt.Println("OnClose:", c.RemoteAddr().String(), err)
	})
	return u
}

// start one websocket server per shard
// start on an array of ports to support 1M connections per shard.
func StartWs(address []string, fn func(u websocket.Upgrader)) {

	onWebsocket := func(w http.ResponseWriter, r *http.Request) {
		if *errBeforeUpgrade {
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte("returning an error"))
			return
		}
		// time.Sleep(time.Second * 5)
		upgrader := newUpgrader()
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			panic(err)
		}
		conn.SetReadDeadline(time.Time{})

	}

	flag.Parse()
	mux := &http.ServeMux{}
	mux.HandleFunc("/ws", onWebsocket)

	svr := nbhttp.NewServer(nbhttp.Config{
		Network: "tcp",
		Addrs:   address,
		Handler: mux,
	})

	err := svr.Start()
	if err != nil {
		fmt.Printf("nbio.Start failed: %v\n", err)
		return
	}

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)
	<-interrupt
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	svr.Shutdown(ctx)
}
