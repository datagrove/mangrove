package main

import (
	"embed"
	_ "embed"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/datagrove/mangrove/mangrove"
	"github.com/spf13/cobra"
)

// testview --port 5078 --sftp localhost:5079 --http localhost:5078 --store ./TestResults

var (
	//go:embed dist/**
	res embed.FS
)

var config mangrove.Config

// main is where we set up the web hooks, file hooks, apis, and reports
func main() {
	h, _ := os.UserHomeDir()
	config = mangrove.Config{
		Http:  "localhost:5078",
		Sftp:  "localhost:5079",
		Store: "TestResults",
		Key:   path.Join(h, ".ssh", "id_rsa"),
	}

	rootCmd := &cobra.Command{
		Use: "testview ",
		Run: func(cmd *cobra.Command, args []string) {
			log.Printf("%v", config)
			launch()
		}}

	rootCmd.PersistentFlags().StringVar(&config.Http, "http", ":5078", "http address")
	rootCmd.PersistentFlags().StringVar(&config.Sftp, "sftp", ":5079", "sftp address")
	rootCmd.PersistentFlags().StringVar(&config.Store, "store", "TestResults", "test result store")
	rootCmd.Execute()
}

func launch() {
	mux := http.NewServeMux()
	var staticFS = fs.FS(res)
	htmlContent, err := fs.Sub(staticFS, "dist")
	if err != nil {
		log.Fatal(err)
	}
	fs := http.FileServer(http.FS(htmlContent))
	mux.Handle("/", fs)

	mux.Handle("/TestResults/", http.StripPrefix("/TestResults/", http.FileServer(http.Dir(config.Store))))

	mux.HandleFunc("/api/runs", func(w http.ResponseWriter, r *http.Request) {
		dir := []string{}
		os.Mkdir(config.Store, 0777)
		d, e := os.ReadDir(config.Store)
		if e != nil {
			return
		}
		for _, batch := range d {
			dir = append(dir, batch.Name())
		}
		json.NewEncoder(w).Encode(dir)
	})
	mux.HandleFunc("/api/run/", func(w http.ResponseWriter, r *http.Request) {
		batch := path.Join(config.Store, r.URL.Path[8:])

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

	err = http.ListenAndServe(config.Http, mux)
	log.Fatal(err)
}
