package mangrove

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path"
	"strconv"
	"time"
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
