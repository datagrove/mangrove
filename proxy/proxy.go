package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/datagrove/mangrove/mangrove"
)

var (
	//go:embed ui/dist/**
	Res embed.FS
)

// ProxyRequestHandler handles the http request using proxy

// a SpaFileSystem is a http.FileSystem that will serve index.html for any path that does not exist
type spaFileSystem struct {
	root http.FileSystem
}

func (fs *spaFileSystem) Open(name string) (http.File, error) {
	f, err := fs.root.Open(name)
	if os.IsNotExist(err) {
		return fs.root.Open("index.html")
	}
	return f, err
}

func main() {

	// we can offer a hook to process; the hook returns the url
	// or we could have a dictionary of mapping the url?
	// a function seems more flexible, could take a variety of arguments
	opt := &mangrove.MangroveServer{
		Name:     "imisgo",
		Res:      Res,
		Launch:   nil,
		Root:     "",
		ProxyTo:  "https://www.google.com",
		Embed:    "/embed/",
		AddrsTLS: []string{"localhost:8080"},
		Addrs:    []string{},
		OnLogin: func() string {
			return "https://www.google.com"
		},
	}
	cmd := mangrove.DefaultCommands(opt)
	cmd.Execute()
}

func justEmbed() {
	mux := http.NewServeMux()

	var staticFS = fs.FS(Res)
	// should this be in config?
	htmlContent, err := fs.Sub(staticFS, "ui/dist")
	if err != nil {
		panic(err)
	}
	fs := http.FileServer(&spaFileSystem{http.FS(htmlContent)})
	mux.Handle("/embed/", http.StripPrefix("/embed/", fs))

	log.Fatal(http.ListenAndServe(":8080", mux))
}

func justEmbed2() {
	mux := http.NewServeMux()

	var staticFS = fs.FS(Res)
	// should this be in config?
	htmlContent, err := fs.Sub(staticFS, "ui/dist")
	if err != nil {
		panic(err)
	}
	fs := http.FileServer(&spaFileSystem{http.FS(htmlContent)})
	mux.Handle("/", fs)

	log.Fatal(http.ListenAndServe(":8080", mux))
}
