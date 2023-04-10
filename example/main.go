package main

import (
	"embed"
	"log"

	"github.com/datagrove/mangrove/mangrove"
	"github.com/joho/godotenv"
)

var svrAetna = &mangrove.FileSystem{}
var svr1199 = &mangrove.FileSystem{}
var (
	//go:embed ui/dist/**
	res embed.FS
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	x := mangrove.NewServer(&mangrove.Config{
		Key:   "",
		Http:  "localhost:5078",
		Sftp:  "localhost:5079",
		Store: "data",
		Ui:    res,
	})

	// tasks are simple cli commands with corresponding directories. the command is executed when a file is copied into the directory.
	if false {

		// files that are fetched into 837 will need to trigger an 837 task
		// these need a name so we can trigger them from cli or from an api
		x.FetchTask("837", &mangrove.SftpFetch{})
		x.FetchTask("834", &mangrove.SftpFetch{})

		x.FileTask("834", func(f string) error {
			return nil
		})
		x.FileTask("834b", func(f string) error {
			return nil
		})
		x.FileTask("837", func(f string) error {

			return nil
		})
		// after running prop, we need to trigger a sftp put.
		x.FileTask("prop", func(f string) error {
			return nil
		})
		x.PutTask("837b", &mangrove.SftpPut{})

	}

	x.Run()

}
