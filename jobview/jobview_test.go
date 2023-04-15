package jobview

import (
	"os"
	"testing"

	"github.com/datagrove/mangrove/mangrove"
)

func Test_web(t *testing.T) {
	os.Args = []string{"jobview", "start"}
	DefaultServer("jobview", []Job{}, func(svr *mangrove.Server) error {
		return nil
	})
}
