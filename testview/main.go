package main

import (
	"embed"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/datagrove/mangrove/mangrove"
)

// testview --port 5078 --sftp localhost:5079 --http localhost:5078 --store ./TestResults

var (
	//go:embed ui/dist/**
	res embed.FS
)

// main is where we set up the web hooks, file hooks, apis, and reports
func main() {
	x := mangrove.DefaultServer("testview", res, launch)
	x.Execute()
}

// add apis here
func launch(x *mangrove.Server) error {
	mux := x.Mux
	mux.Handle("/TestResults/", http.StripPrefix("/TestResults/", http.FileServer(http.Dir(x.Config.Store))))

	mux.HandleFunc("/api/runs", func(w http.ResponseWriter, r *http.Request) {
		dir := []string{}
		os.Mkdir(x.Config.Store, 0777)
		d, e := os.ReadDir(x.Config.Store)
		if e != nil {
			return
		}
		for _, batch := range d {
			dir = append(dir, batch.Name())
		}
		json.NewEncoder(w).Encode(dir)
	})
	mux.HandleFunc("/api/run/", func(w http.ResponseWriter, r *http.Request) {
		batch := path.Join(x.Config.Store, r.URL.Path[8:])

		// index.json written at beginning of each test, it lets us know what files are expected
		root := []string{}
		b, e := os.ReadFile(path.Join(batch, "index.json"))
		if e != nil {
			return
		}

		json.Unmarshal(b, &root)

		testcode := map[string]string{}
		for _, feature := range root {
			testcode[feature] = "waiting"
		}

		failed := map[string]bool{}

		d, e := os.ReadDir(batch)
		if e != nil {
			log.Printf("%v", e)
		}
		// I don't need this, web can just look for the file
		for _, f := range d {
			if f.IsDir() {
				continue
			}
			//fn := path.Base(f.Name())
			p := strings.Split(f.Name(), ".")
			ext := p[len(p)-1]
			tn := f.Name()[:len(f.Name())-len(ext)-1]
			switch ext {
			case "error":
				failed[tn] = true
			case "txt": // error
				testcode[tn] = "pass"
			}
		}
		for key := range failed {
			testcode[key] = "fail"
		}

		json.NewEncoder(w).Encode(testcode)
	})
	return nil
}
