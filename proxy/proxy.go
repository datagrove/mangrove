package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
)

var (
	//go:embed ui/dist/**
	Res embed.FS
)

// NewProxy takes target host and creates a reverse proxy
func NewProxy(targetHost string) (*httputil.ReverseProxy, error) {
	url, err := url.Parse(targetHost)
	if err != nil {
		return nil, err
	}

	r := httputil.NewSingleHostReverseProxy(url)

	return r, nil
}

// ProxyRequestHandler handles the http request using proxy
func ProxyRequestHandler(proxy *httputil.ReverseProxy) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/favicon.ico" {
			// return substitute page
			return
		}
		proxy.ServeHTTP(w, r)
	}
}

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

// mainly look for
func main2() {
	// initialize a reverse proxy and pass the actual backend server url here
	proxy, err := NewProxy("http://my-api-server.com")
	if err != nil {
		panic(err)
	}

	fsys, err := fs.Sub(Res, "ui/dist")
	if err != nil {
		panic(err)
	}
	//http.Handle("/", http.FileServer(http.FS(fsys)))
	fs := http.FileServer(&spaFileSystem{http.FS(fsys)})
	mux := http.NewServeMux()
	mux.Handle("/", fs)

	// handle all requests to your server using the proxy
	http.HandleFunc("/proxy", ProxyRequestHandler(proxy))
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func main() {
	var staticFS = fs.FS(Res)
	// should this be in config?
	htmlContent, err := fs.Sub(staticFS, "ui/dist")
	if err != nil {
		panic(err)
	}
	fs := http.FileServer(&spaFileSystem{http.FS(htmlContent)})
	mux := http.NewServeMux()
	mux.Handle("/", fs)
	log.Fatal(http.ListenAndServe(":8080", mux))
}
