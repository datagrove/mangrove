package main

import (
	"log"
	"os"
	"os/signal"

	"github.com/gliderlabs/ssh"
)

// task bot can run wasm code on a clock, ssh cli, DM, or webhook/api
// use wasi to give the code access to native resourses and datagrove file systems.

type Config struct {
	Sftp string
	Key  string
}

func main() {

	sx := &Config{
		Sftp: ":2022",
	}
	go func() {
		ssh_server := ssh.Server{
			Addr: sx.Sftp,
			PublicKeyHandler: func(ctx ssh.Context, key ssh.PublicKey) bool {
				return true
			},
			SubsystemHandlers: map[string]ssh.SubsystemHandler{
				"sftp": SftpHandlerx,
			},
		}
		kf := ssh.HostKeyFile(sx.Key)
		kf(&ssh_server)
		log.Fatal(ssh_server.ListenAndServe())
	}()
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)
	<-interrupt
	log.Println("exit")

}
