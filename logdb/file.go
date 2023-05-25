package logdb

import (
	"io"
	"io/fs"
)

// there is no standard go read/write interface
type FileStore interface {
	io.Closer
	fs.FS
	Create(name string) (File, error)
}

type File interface {
	io.Closer
	io.WriterAt
	Length() int64
}
