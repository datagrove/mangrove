package main

import (
	"os"

	"github.com/datagrove/mangrove/jobview"
	"github.com/datagrove/mangrove/mangrove"
)

func main() {
	os.Args = []string{"jobview", "start"}
	jobview.DefaultServer("jobview", []jobview.Job{}, func(svr *mangrove.Server) error {
		return nil
	})
}
