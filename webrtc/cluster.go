package main

import (
	"bufio"
	"crypto/rand"
	"encoding/binary"
	"fmt"
	"net"
	"strconv"
	"sync"

	"github.com/cornelk/hashmap"
	"github.com/lesismal/nbio/nbhttp/websocket"
)

//  Each membership update is tagged with
// a monotonically increasing epoch id (𝑒_𝑖𝑑) and is performed
// across the deployment only after all node leases have expired

// each shard will only talk to the same shard on its peers.
// messages that need to cross shards will done on the source system

type ClientConn interface {
	Send(data []byte)
	Close()
}

type ClusterConfig struct {
	Me           int
	Peer         []string // ip address, different port for each shard.
	ShardStart   int      //
	Ws           string   // base address with %d for ports we use.
	WsStart      int
	PortPerShard int
	Shard        []Shard
}

func (cfg *ClusterConfig) ShardsPerPeer() int {
	return len(cfg.Shard)
}
func (cfg *ClusterConfig) NumPeers() int {
	return len(cfg.Peer)
}
func (cfg *ClusterConfig) NumShards() int {
	return len(cfg.Shard) * len(cfg.Peer)
}

// Use the high bits to divide files by peer and by shard
// we can use 8 bits for each. (256 shards should be plenty, we can use multiple cores per shard, and will block on the number of parallel streams to disk)
// even 4 bits would be enough for peers, unlikely this would grow beyond 16.

// this allows files with prefixes to be sorted together
// [database:32][:device] 32 bits for database, 32 bits for device

// the lower bits of the logid pick a shard.
// so if there are 30 shards among 3 peers
// then the first 10 shards are on the first peer
// the next 10 are on the second peer, etc.
func (cl *Cluster) log2Shard(logid FileId) int {
	return int(logid>>48) & 255
}
func (cl *Cluster) id2Peer(logid FileId) int {
	return int(logid >> 56)
}

// each shard should allow its own ip address
// how do we communicate to the client w
type Cluster struct {
	Epoch  int64 // zeus paper says we just drop packets from past and future? shouldn't future packet force us to try to join?
	shadow bool  // follow write, but don't take clients

	// we should probably let this grow, instead of taking in the config?
	Member []bool
	// send  net.Conn
	// recv  net.Conn
	*ClusterConfig // do we update this epochs?
	// tcp is two-way, so we only need to connect i<j
	// the listener will take one byte to identify the caller.
	shard []*ClusterShard
}

func (c *Cluster) Join() {
	// try to connect to all peers

}

// maintains a connection to the same shard in every other peer
type ClusterShard struct {
	thisShard int
	*Cluster
	hashmap.Map[DeviceId, *websocket.Conn]
	peer  []net.Conn
	Lease []int64 // update on messages
}

func (cl *ClusterShard) GlobalShard() int {
	return cl.thisShard + cl.Me*cl.NumPeers()
}

// if the device id is on another shard, we need to switch this message to that shard
// this is done mostly for low priority/low volume messages like websock signaling
func (cl *ClusterShard) ClientSend(id DeviceId, data []byte) {
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

// send to every peer in the same shard
func (cl *ClusterShard) Broadcast(op byte, header []byte, payload []byte) {
	for i := 0; i < len(cl.peer); i++ {
		if i == cl.Me {
			continue
		}
		var ol = make([]byte, 5)
		binary.LittleEndian.PutUint32(ol, uint32(len(header)+len(payload)+1))
		ol[4] = op
		cl.peer[i].Write([]byte{op})
		cl.peer[i].Write(header)
		cl.peer[i].Write(payload)
	}
}
func (cl *ClusterShard) Send(p PeerId, data []byte) {
	cl.peer[p].Write(data)
}

// this can also be used to send to a device or file shard.
// devices connect to the shard that contains their profile database.
func (cl *ClusterShard) SendToPrimary(id int64, data []byte) {
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

	r := &Cluster{
		ClusterConfig: cfg,
	}

	// build the shards
	r.shard = make([]*ClusterShard, cfg.ShardsPerPeer())
	var wg sync.WaitGroup
	wg.Add(cfg.ShardsPerPeer())
	for i := 0; i < cfg.ShardsPerPeer(); i++ {
		go func(i int) {
			sh, e := NewClusterShard(r, i)
			if e != nil {
				panic(e)
			}
			r.shard = append(r.shard, sh)
			wg.Done()
		}(i)
	}
	wg.Wait()
	return r, nil
}

func NewClusterShard(cfg *Cluster, shard int) (*ClusterShard, error) {
	r := &ClusterShard{
		Cluster:   cfg,
		thisShard: shard,
	}

	pcn := make([]net.Conn, len(cfg.Peer))
	port := strconv.Itoa(cfg.ShardStart + shard)
	listener, err := net.Listen("tcp", cfg.Peer[cfg.Me]+":"+port)
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

	recv := func(data []byte) {
		logid := binary.LittleEndian.Uint64(data[4:12])
		shard := r.log2Shard(FileId(logid))
		r.Shard[shard].Recv(FileId(logid), data[12:])
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
	wsport := cfg.WsStart + cfg.Me*cfg.PortPerShard*cfg.ShardsPerPeer()
	for i := 0; i < cfg.ShardsPerPeer(); i++ {
		addr := make([]string, cfg.PortPerShard)
		for k := 0; k < cfg.PortPerShard; k++ {
			addr[k] = fmt.Sprintf("%s:%d", cfg.Ws, wsport)
			wsport++
		}

		StartWs(addr, func(u websocket.Upgrader) {
			u.OnOpen(func(c *websocket.Conn) {
				randomBytes := [16]byte{}
				_, err := rand.Read(randomBytes[:])
				if err != nil {
					panic(err)
				}
				cx := &WebsocketConn{
					conn: c,
				}
				c.SetSession(cx)

			})

			u.OnMessage(func(c *websocket.Conn, messageType websocket.MessageType, data []byte) {
				r.Shard[i].ClientRecv(c.Session().(ClientConn), data)
			})
		})
	}
	// make it a little easier on the test server

	return r, nil
}

type Shard interface {
	Connect(cl *ClusterShard)
	Recv(PeerId, []byte)
	ClientConnect(ClientConn)
	ClientRecv(ClientConn, []byte)
}

// a membership change starts when a peer fails.
// eventually we could support something like jump hashing to allow running when down a peer, but strategy for now s to spin up a replacement
func (cl *Cluster) epochChange() {
	panic("implement me")
}