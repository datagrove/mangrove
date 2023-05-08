package main

import (
	"os"
	"testing"
)

func Test_start(t *testing.T) {
	os.Args = []string{"proxy", "start"}
	main()
}
