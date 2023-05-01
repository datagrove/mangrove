package main

import (
	"os"
	"testing"
)

func Test_start(t *testing.T) {
	os.Args = []string{"proxy", "start"}
	main()
}

func Test_embed(t *testing.T) {
	justEmbed()
}

func Test_embed2(t *testing.T) {
	justEmbed2()
}
