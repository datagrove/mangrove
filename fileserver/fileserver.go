package fileserver

import (
	"os"
	"path"
)

func DefaultSsh() (string, error) {
	h, e := os.UserHomeDir()
	if e != nil {
		return "", e
	}
	return path.Join(h, ".ssh", "id_rsa"), nil
}
