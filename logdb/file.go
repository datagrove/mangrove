package logdb

import (
	"io"
	"io/fs"
	"os"
	"path/filepath"
)

// there is no standard go read/write interface
type FileStore interface {
	io.Closer
	Create(name string) (File, error)
	Stat(name string) (os.FileInfo, error)
}

type File interface {
	io.Closer
	io.WriterAt
	io.ReaderAt
}

type FileImpl struct {
	root string
}

// Stat implements FileStore
func (*FileImpl) Stat(name string) (fs.FileInfo, error) {
	return os.Stat(name)
}

// Close implements FileStore
func (*FileImpl) Close() error {
	return nil
}

// Create implements FileStore
func (f *FileImpl) Create(name string) (File, error) {
	return os.Create(filepath.Join(f.root, name))
}

var _ FileStore = &FileImpl{}

func NewFileStore(path string) FileStore {
	return &FileImpl{
		root: path,
	}
}
