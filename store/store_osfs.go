package store

import (
	"fmt"
	"io/fs"
	"os"
)

type Osfs struct {
	Root string
}

// Delete implements Fsi
func (fs *Osfs) Delete(sid int64, filePath string) error {
	filePath = fmt.Sprintf("%s/%d/%s", fs.Root, sid, filePath)
	return os.Remove(filePath)
}

// Ls implements Fsi
func (fx *Osfs) Ls(sid int64) ([]FileInfo, error) {
	fi := []FileInfo{}
	filePath := fmt.Sprintf("%s/%d", fx.Root, sid)
	fs.WalkDir(os.DirFS(filePath), "/", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		fi = append(fi, FileInfo{
			Path: path,
		})
		return nil
	})
	return fi, nil

}

// Read implements Fsi
func (fs *Osfs) Read(sid int64, filePath string) ([]byte, error) {
	filePath = fmt.Sprintf("%s/%d/%s", fs.Root, sid, filePath)
	return os.ReadFile(filePath)
}

// Write implements Fsi
func (fs *Osfs) Write(sid int64, filePath string, data []byte) error {
	filePath = fmt.Sprintf("%s/%d/%s", fs.Root, sid, filePath)
	return os.WriteFile(filePath, data, 0644)
}

var _ Fsi = (*Osfs)(nil)
