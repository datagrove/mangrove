package mangrove

import (
	"log"
	"testing"
)

func Test_Connect(t *testing.T) {
	x, e := Open(&SshConnection{
		Host:      "localhost",
		Port:      2022,
		User:      "jim",
		Password:  "jhsimple",
		PublicKey: nil,
	})
	if e != nil {
		t.Error(e)
	}
	fs, e := x.ReadDir("/")

	//fs, e := x.Glob("*.txt")
	if e != nil {
		t.Error(e)
	}
	for _, f := range fs {
		log.Println(f.Name())
	}
	if e != nil {
		t.Error(e)
	}
	defer x.Close()
}
