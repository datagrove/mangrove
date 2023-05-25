package logdb

import (
	"fmt"
	"testing"
)

func Test_one(t *testing.T) {
	rope := NewRope("Hello, ")
	rope = rope.Concatenate(NewRope("world!"))
	fmt.Println(rope.String())

	substring, _ := rope.Substring(7, 12)
	fmt.Println(substring.String())
}
