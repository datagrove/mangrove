package x12

import "fmt"

func Pad(s string, length int) string {
	return fmt.Sprintf("%-*s", length, s)
}
