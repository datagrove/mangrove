package server

import (
	"context"
	"fmt"
	"io/fs"
	"os"

	"github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	"github.com/jackc/pgx/v5/pgtype"
)

type Fsi interface {
	Write(sid int64, filePath string, data []byte) error
	Ls(sid int64) ([]FileInfo, error)
	Read(sid int64, filePath string) ([]byte, error)
	Delete(sid int64, filePath string) error
}

type Dbfs struct {
	mg *Server
}

type Osfs struct {
	mg *Server
}

// Delete implements Fsi
func (fs *Osfs) Delete(sid int64, filePath string) error {
	filePath = fmt.Sprintf("%s/%d/%s", fs.mg.Root, sid, filePath)
	return os.Remove(filePath)
}

// Ls implements Fsi
func (fx *Osfs) Ls(sid int64) ([]FileInfo, error) {
	fi := []FileInfo{}
	filePath := fmt.Sprintf("%s/%d", fx.mg.Root, sid)
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
	filePath = fmt.Sprintf("%s/%d/%s", fs.mg.Root, sid, filePath)
	return os.ReadFile(filePath)
}

// Write implements Fsi
func (fs *Osfs) Write(sid int64, filePath string, data []byte) error {
	filePath = fmt.Sprintf("%s/%d/%s", fs.mg.Root, sid, filePath)
	return os.WriteFile(filePath, data, 0644)
}

var _ Fsi = (*Osfs)(nil)

var _ Fsi = (*Dbfs)(nil)

func (d *Dbfs) Write(sid int64, filePath string, data []byte) error {
	return d.mg.qu.InsertFile(context.Background(), mangrove_sql.InsertFileParams{
		Sid:      sid,
		Count:    countPath(filePath),
		Path:     filePath,
		Size:     0,
		Modified: pgtype.Timestamp{},
		Data:     data,
	})
}

type FileInfo struct {
	Path string `json:"path,omitempty"`
}

func (d *Dbfs) Ls(sid int64) ([]FileInfo, error) {
	ax, e := d.mg.qu.ListFiles(context.Background(), sid)
	if e != nil {
		return nil, e
	}
	r := []FileInfo{}
	for _, v := range ax {
		r = append(r, FileInfo{
			Path: v.Path,
		})

	}
	return r, nil
}
func (d *Dbfs) Read(sid int64, filePath string) ([]byte, error) {
	a, e := d.mg.qu.ReadFile(context.Background(), mangrove_sql.ReadFileParams{
		Sid:   sid,
		Count: 0,
		Path:  filePath,
	})
	return a.Data, e
}

func (d *Dbfs) Delete(sid int64, filePath string) error {
	return d.mg.qu.DeleteFile(context.Background(), mangrove_sql.DeleteFileParams{
		Sid:   sid,
		Count: countPath(filePath),
		Path:  filePath,
	})
}
