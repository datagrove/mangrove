package main

import (
	"bufio"
	"encoding/binary"
	"net"
)

// each shard should allow its own ip address
type Cluster struct {
	// send  net.Conn
	// recv  net.Conn
	me    int
	shard []Shard
	// tcp is two-way, so we only need to connect i<j
	// the listener will take one byte to identify the caller.
	peer []net.Conn
}

// the lower bits of the logid pick a shard.
// so if there are 30 shards among 3 peers
// then the first 10 shards are on the first peer
// the next 10 are on the second peer, etc.
func (cl *Cluster) log2Shard(logid LogId) int {
	return int(logid) % len(cl.shard)
}

func (cl *Cluster) Broadcast(data []byte, fn func()) {
	for i := 0; i < len(cl.peer); i++ {
		if i == cl.me {
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
	p64 := id % int64(len(cl.shard)*len(cl.peer))
	p := int(p64 / int64(len(cl.shard)))
	if p == cl.me {
		cl.shard[cl.log2Shard(id)].Recv(id, data)
	} else {
		cl.peer[p].Write(data)
	}
}

// there is a tcp connection between the same shard on each machine
func NewCluster(me int, peer []string, shard []Shard) (*Cluster, error) {
	pcn := make([]net.Conn, len(peer))
	listener, err := net.Listen("tcp", peer[me])
	if err != nil {
		panic(err)
	}
	defer listener.Close()

	for i := 0; i < me; i++ {
		id := []byte{byte(me)}
		conn, e := net.Dial("tcp", peer[i])
		if e != nil {
			return nil, e
		}
		pcn[i] = conn
		conn.Write(id)
	}
	r := &Cluster{
		peer:  pcn,
		shard: shard,
	}
	recv := func(data []byte) {
		logid := binary.LittleEndian.Uint64(data[4:12])
		shard := r.log2Shard(LogId(logid))
		r.shard[shard].Recv(LogId(logid), data[12:])
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

	return r, nil
}

type Shard interface {
	Recv(PeerId, []byte)
	ClientRecv([]byte)
}

func (cl *Cluster) epochChange() {
	panic("implement me")
}
