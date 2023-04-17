package mangrove

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/lesismal/llib/std/crypto/tls"
	"github.com/lesismal/nbio/nbhttp"
	"github.com/lesismal/nbio/nbhttp/websocket"
	"golang.org/x/exp/slices"
)

var (
	svr *nbhttp.Server
)

type RpcExec interface {
	recv(data []byte) error
}
type RpServer interface {
	connect(*websocket.Conn, RpcExec) (error, RpcExec)
}

func (s *Socket) recv(data []byte) {
	i := slices.IndexFunc(data, func(x byte) bool { return x == 10 })
	var rpc Rpc
	json.Unmarshal(data[:i], &rpc)
	r, e := s.svr.api[rpc.Method](s, rpc.Params, data[i+1:])
	if e != nil {
		log.Printf("error: %v", e)
	}
	var o struct {
		Id     int64       `json:"id"`
		Result interface{} `json:"result"`
	}
	o.Id = rpc.Id
	o.Result = r
	b, _ := json.Marshal(&o)
	s.conn.WriteMessage(websocket.BinaryMessage, b)
}

// the messages can be json\nbinary, or could just be cbor, or could have an endpoint for each
func Ws(svrx *Server, rsaCertPEM, rsaKeyPEM []byte) {
	mux := svrx.Mux
	cert, err := tls.X509KeyPair(rsaCertPEM, rsaKeyPEM)
	if err != nil {
		log.Fatalf("tls.X509KeyPair failed: %v", err)
	}
	tlsConfig := &tls.Config{
		Certificates:       []tls.Certificate{cert},
		InsecureSkipVerify: true,
	}
	onWebsocket := func(w http.ResponseWriter, r *http.Request) {
		x := &Socket{
			svr: svrx,
		}
		u := websocket.NewUpgrader()
		u.OnMessage(func(c *websocket.Conn, messageType websocket.MessageType, data []byte) {
			x.recv(data)
			c.SetReadDeadline(time.Now().Add(nbhttp.DefaultKeepaliveTime))
		})
		u.OnClose(func(c *websocket.Conn, err error) {

		})
		// time.Sleep(time.Second * 5)
		conn, err := u.Upgrade(w, r, nil)
		if err != nil {
			panic(err)
		}
		x.conn = conn.(*websocket.Conn)

		//wsConn := conn.(*websocket.Conn)

		//c.WriteMessage(messageType, data)
	}
	mux.HandleFunc("/wss", onWebsocket)

	svr = nbhttp.NewServer(nbhttp.Config{
		Network:   "tcp",
		AddrsTLS:  []string{"localhost:8888"},
		TLSConfig: tlsConfig,
		Handler:   mux,
	})

	err = svr.Start()
	if err != nil {
		fmt.Printf("nbio.Start failed: %v\n", err)
		return
	}
	defer svr.Stop()

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)
	<-interrupt
	log.Println("exit")
}
