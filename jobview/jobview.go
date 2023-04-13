package jobview

import (
	"embed"

	"github.com/datagrove/mangrove/mangrove"
	"github.com/spf13/cobra"
)

var (
	//go:embed ui/dist/**
	res embed.FS
)

// a job server needs a list of jobs, not unlike cobra commands, but typically all the parameters need to be resolved since its going off a clock.

// It can also use launch to add api's, but it's not clear that this is useful given that UI won't know anything about them.

// we might want to allow a job to control a frame of the ui, but how?
// maybe we should have a list of functions that take a bit of json to configure themselves.
type Job struct {
	Name   string
	Schema string
	Run    func(*mangrove.Context, string) error
}

func DefaultServer(name string, jobs []Job, launch func(*mangrove.Server) error) *cobra.Command {

	j := mangrove.DefaultServer(name, res, func(svr *mangrove.Server) error {
		launch(svr)
		api(svr)
		return nil
	})

	return j
}

func api(svr *mangrove.Server) {
	// api := svr.Router.PathPrefix("/api").Subrouter()
	// api.HandleFunc("/job", func(w http.ResponseWriter, r *http.Request) {
	// 	w.Write([]byte("job"))
	// })
}
