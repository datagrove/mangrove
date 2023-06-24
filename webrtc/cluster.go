package main

import (
	"bufio"
	"context"
	"encoding/binary"
	"flag"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/cornelk/hashmap"
	"github.com/lesismal/nbio/nbhttp"
	"github.com/lesismal/nbio/nbhttp/websocket"
)

type ClusterConfig struct {
	Me    int
	Peer  []string
	Shard []Shard

	Ws           string // base address
	WsStart      int
	PortPerShard int
	hashmap.Map[DeviceId, *websocket.Conn]
}

func (cl *Cluster) ClientSend(id DeviceId, data []byte) {
	// to send to another client we first need to send to the client's host computer
	// we need to put the DeviceId in the header so that we can route it to the correct shard.

	peerid := cl.id2Peer(id)
	if peerid == cl.Me {
		o, ok := cl.Get(id)
		if ok {
			o.WriteMessage(websocket.BinaryMessage, data)
		}
	} else {
		var header = make([]byte, 12)
		binary.LittleEndian.PutUint32(header[0:4], uint32(len(data)+12))
		binary.LittleEndian.PutUint64(header[4:12], uint64(id))
		cl.peer[peerid].Write(header)
		cl.peer[peerid].Write(data)
	}
}

// each shard should allow its own ip address
// how do we communicate to the client w
type Cluster struct {
	// send  net.Conn
	// recv  net.Conn
	*ClusterConfig
	// tcp is two-way, so we only need to connect i<j
	// the listener will take one byte to identify the caller.
	peer []net.Conn
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

func (cl *Cluster) SendClient()

// the lower bits of the logid pick a shard.
// so if there are 30 shards among 3 peers
// then the first 10 shards are on the first peer
// the next 10 are on the second peer, etc.
func (cl *Cluster) log2Shard(logid LogId) int {
	return int(logid) % len(cl.Shard)
}
func (cl *Cluster) id2Peer(logid LogId) int {
	return int(logid) / len(cl.Shard)
}

func (cl *Cluster) Broadcast(data []byte) {
	for i := 0; i < len(cl.peer); i++ {
		if i == cl.Me {
			continue
		}
		cl.peer[i].Write(data)
	}
}
func (cl *Cluster) Send(p PeerId, data []byte) {
	cl.peer[p].Write(data)
}

// this can also be used to send to a device or file shard.
// devices connect to the shard that contains their profile database.
func (cl *Cluster) SendToPrimary(id int64, data []byte) {
	// could be me
	p64 := id % int64(len(cl.Shard)*len(cl.peer))
	p := int(p64 / int64(len(cl.Shard)))
	if p == cl.Me {
		cl.Shard[cl.log2Shard(id)].Recv(id, data)
	} else {
		cl.peer[p].Write(data)
	}
}

// there is a tcp connection between the same shard on each machine
func NewCluster(cfg *ClusterConfig) (*Cluster, error) {
	pcn := make([]net.Conn, len(cfg.Peer))
	listener, err := net.Listen("tcp", cfg.Peer[cfg.Me])
	if err != nil {
		panic(err)
	}
	defer listener.Close()

	for i := 0; i < cfg.Me; i++ {
		id := []byte{byte(cfg.Me)}
		conn, e := net.Dial("tcp", cfg.Peer[i])
		if e != nil {
			return nil, e
		}
		pcn[i] = conn
		conn.Write(id)
	}
	r := &Cluster{
		peer:          pcn,
		ClusterConfig: cfg,
	}
	recv := func(data []byte) {
		logid := binary.LittleEndian.Uint64(data[4:12])
		shard := r.log2Shard(LogId(logid))
		r.Shard[shard].Recv(LogId(logid), data[12:])
	}
	clientrecv := func(i int, data []byte) {
		r.Shard[i].ClientRecv(data)
	}
	// Accept incoming connections and handle them in separate goroutines
	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				// Handle the error
				continue
			}
			go func(conn net.Conn) {
				reader := bufio.NewReader(conn)
				b := make([]byte, 1)
				reader.Read(b)
				pcn[b[0]] = conn

				for {
					// Read the length of the message
					lengthBytes, err := reader.Peek(4)
					if err != nil {
						panic(err)
					}
					length := int32(lengthBytes[0])<<24 | int32(lengthBytes[1])<<16 | int32(lengthBytes[2])<<8 | int32(lengthBytes[3])

					// Read the message payload
					payload := make([]byte, length)
					_, err = reader.Read(payload)
					if err != nil {
						panic(err)
					}
					recv(payload)
				}

			}(conn)
		}
	}()

	// maybe not all these will open? can we just skip some? makes it hard on the clients.
	wsport := cfg.WsStart + cfg.Me*cfg.PortPerShard*len(cfg.Shard)
	for i := 0; i < len(cfg.Shard); i++ {
		addr := make([]string, cfg.PortPerShard)
		for k := 0; k < cfg.PortPerShard; k++ {
			addr[k] = fmt.Sprintf("%s:%d", cfg.Ws, wsport)
			wsport++
		}

		StartWs(addr, func(u websocket.Upgrader) {
			u.OnMessage(func(c *websocket.Conn, messageType websocket.MessageType, data []byte) {
				clientrecv(i, data)
			})
		})
	}
	// make it a little easier on the test server

	return r, nil
}

type Shard interface {
	Recv(PeerId, []byte)
	ClientRecv([]byte)
}

// a membership change starts when a peer fails.
// eventually we could support something like jump hashing to allow running when down a peer, but strategy for now s to spin up a replacement
func (cl *Cluster) epochChange() {
	panic("implement me")
}
