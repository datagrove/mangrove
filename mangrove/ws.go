package mangrove

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/lesismal/llib/std/crypto/tls"
	"github.com/lesismal/nbio/nbhttp"
	"github.com/lesismal/nbio/nbhttp/websocket"
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

func onWebsocket(w http.ResponseWriter, r *http.Request) {
	u := websocket.NewUpgrader()
	u.OnMessage(func(c *websocket.Conn, messageType websocket.MessageType, data []byte) {
		c.SetReadDeadline(time.Now().Add(nbhttp.DefaultKeepaliveTime))
	})
	u.OnClose(func(c *websocket.Conn, err error) {

	})
	// time.Sleep(time.Second * 5)
	conn, err := u.Upgrade(w, r, nil)
	if err != nil {
		panic(err)
	}
	_ = conn
	//wsConn := conn.(*websocket.Conn)

	c.WriteMessage(messageType, data)
}

// the messages can be json\nbinary, or could just be cbor, or could have an endpoint for each
func Ws(mux *http.ServeMux, rsaCertPEM, rsaKeyPEM []byte) {
	cert, err := tls.X509KeyPair(rsaCertPEM, rsaKeyPEM)
	if err != nil {
		log.Fatalf("tls.X509KeyPair failed: %v", err)
	}
	tlsConfig := &tls.Config{
		Certificates:       []tls.Certificate{cert},
		InsecureSkipVerify: true,
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
