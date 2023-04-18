package jobview

import (
	"testing"

	"github.com/datagrove/mangrove/mangrove"
)

// the point of the call back is to allow access during startup, which might be from a service. What about open, run though? variadic?

func Test_web(t *testing.T) {
	mangrove.DefaultServer("Job View", mangrove.Res, nil)
}
