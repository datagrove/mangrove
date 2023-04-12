package mangrove

import (
	"os"
	"testing"
)

func Test_one(t *testing.T) {
	os.MkdirAll(".private", 0755)
	os.WriteFile(".private/test.txt", []byte("Hello World"), 0644)
	e := GeneratePgpKey("John Doe", "john@example.com", ".private/john.asc")
	if e != nil {
		t.Fatal(e)
	}
	e = GeneratePgpKey("Joe Doe", "joe@example.com", ".private/joe.asc")
	if e != nil {
		t.Fatal(e)
	}
	e = Encrypt(".private/test.txt", ".private/test.asc", []string{".private/joe.asc", ".private/john.asc"})
	if e != nil {
		t.Fatal(e)
	}
	e = Decrypt(".private/test.asc", ".private/read.txt", ".private/joe.asc")
	if e != nil {
		t.Fatal(e)
	}

	b, e := os.ReadFile(".private/read.txt")
	if e != nil {
		t.Fatal(e)
	}
	if string(b) != "Hello World" {
		t.Fatal("not equal")
	}
}
