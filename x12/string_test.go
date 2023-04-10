package x12

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_one(t *testing.T) {

	assert.Equal(t, "ab    ", Pad("ab", 6), "pad")
}
