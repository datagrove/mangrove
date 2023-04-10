package main

import (
	"github.com/datagrove/mangrove/mangrove"
)

var svrAetna = &mangrove.FileSystem{}
var svr1199 = &mangrove.FileSystem{}

func main() {

	x := mangrove.NewServer(&mangrove.Config{})

	// tasks are simple cli commands with corresponding directories. the command is executed when a file is copied into the directory.
	x.AddTask("834", func(f string) error {
		return nil
	}, mangrove.SftpGet(svrAetna, "*.edi"))
	x.AddTask("834b", func(f string) error {
		return nil
	})
	x.AddTask("837", func(f string) error {
		// process
		return nil
	}, mangrove.SftpGet(svr1199, "*.edi"))
	x.AddTask("prop", func(f string) error {
		return nil
	})
	x.AddTask("837b", nil, mangrove.SftpPut(svr1199, "dir"))

	x.Run()

}
