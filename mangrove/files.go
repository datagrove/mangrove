package mangrove

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path"
	"strconv"
	"strings"
	"time"

	cp "github.com/otiai10/copy"
)

// Context is for a single container store

func formatMillisecond(t time.Time) string {
	y, m, d := t.Date()
	td := (int64(y)*100+int64(m))*100 + int64(d)
	hh, mm, ss := t.Clock()
	tc := (int64(hh)*100+int64(mm))*100 + int64(ss)
	ms := t.Nanosecond() / int(time.Millisecond)
	tm := (td*1000000+tc)*1000 + int64(ms)
	return strconv.FormatInt(tm, 10)
}

// this could use parallel processing which would generate multiple tasks
func FilesDo(ctx *Context, dir string, fn func(ctx *Context, path string) error) error {
	task := ctx.TaskLog()

	fs, e := os.ReadDir(dir)
	if e != nil {
		return e
	}
	for _, f := range fs {
		if f.IsDir() {
			continue
		}
		pth := path.Join(dir, f.Name())
		b, e := os.ReadFile(pth)
		if e != nil {
			return e
		}

		h := sha256.New()
		h.Write(b)
		bs := h.Sum(nil)
		fchk := hex.EncodeToString(bs)
		_, e = os.Stat(path.Join(dir, "out", fchk))
		if e == nil {
			// file already exists
			task.Log.Info().Str("file", f.Name()).Msg("file already exists")
			os.Remove(pth)
			continue
		}

		e = fn(ctx, pth)
		if e != nil {
			task.Log.Info().Str("file", f.Name()).Err(e)
			os.Rename(pth, path.Join(dir, "error", f.Name()))
		} else {
			task.Log.Info().Str("file", f.Name()).Msg("file processed")
			os.Rename(pth, path.Join(dir, "old", f.Name()))
		}
	}
	return nil
}

func (s *Server) Mv(from, to string, sess *Session) error {
	from, e := s.Authorize(&sess.UserDevice, from, Read)
	if e != nil {
		return e
	}
	to, e = s.Authorize(&sess.UserDevice, to, Write)
	if e != nil {
		return e
	}

	return nil
}

func (s *Server) Cp(from, to string, sess *Session) error {
	from, e := s.Authorize(&sess.UserDevice, from, Read)
	if e != nil {
		return e
	}
	to, e = s.Authorize(&sess.UserDevice, to, Write)
	if e != nil {
		return e
	}
	cp.Copy(from, to)
	return nil
}

func (s *Server) Mkdir(to string, sess *Session) error {
	to, e := s.Authorize(&sess.UserDevice, to, Write)
	if e != nil {
		return e
	}

	return os.Mkdir(to, 0755)
}
func (s *Server) Rm(to string, sess *Session) error {

	to, e := s.Authorize(&sess.UserDevice, to, Write)
	if e != nil {
		return e
	}
	return os.RemoveAll(to)
}

func (s *Server) Upload(to string, data []byte, sess *Session) error {
	to, e := s.Authorize(&sess.UserDevice, to, Write)
	if e != nil {
		return e
	}
	return os.WriteFile(to, data, 0644)
}
func (s *Server) Download(to string, sess *Session) ([]byte, error) {
	to, e := s.Authorize(&sess.UserDevice, to, Read)
	if e != nil {
		return nil, e
	}
	return os.ReadFile(to)
}
func (s *Server) Exec(to string, sess *Session) error {
	to, e := s.Authorize(&sess.UserDevice, to, Exec)
	if e != nil {
		return e
	}
	// the first line of the file should tell us how to execute it.
	f, e := os.ReadFile(to)
	if e != nil {
		return e
	}
	ln := strings.Split(string(f), "\n")
	fexec, ok := s.GetRuntime(ln[0])
	if ok {
		ctx, e := NewContext(s.Home, path.Dir(to))
		if e != nil {
			return e
		}
		return fexec(ctx, string(f))
	} else {
		return fmt.Errorf("no runtime for %s", ln[0])
	}
}

type Runtime func(*Context, string) error

func (s *Server) GetRuntime(name string) (Runtime, bool) {
	f, ok := s.Runtime[name]
	return f, ok
}

func (s *Server) Authorize(u *UserDevice, to string, priv int) (string, error) {
	return path.Join(u.Home, to), nil
}

// privileges on folders
const (
	Read  = 1
	Write = 2
	Exec  = 4
)
