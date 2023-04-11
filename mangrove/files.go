package mangrove

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path"
	"strconv"
	"time"

	"github.com/rs/zerolog"
)

// how should we manage context?

type Context struct {
	Config *Config
	Log    zerolog.Logger
}

func formatMillisecond(t time.Time) string {
	y, m, d := t.Date()
	td := (int64(y)*100+int64(m))*100 + int64(d)
	hh, mm, ss := t.Clock()
	tc := (int64(hh)*100+int64(mm))*100 + int64(ss)
	ms := t.Nanosecond() / int(time.Millisecond)
	tm := (td*1000000+tc)*1000 + int64(ms)
	return strconv.FormatInt(tm, 10)
}

func NewContext(config *Config) (*Context, error) {
	fn := formatMillisecond(time.Now()) + ".log"
	h, e := os.Create(path.Join(config.Store, "log", fn))
	if e != nil {
		return nil, e
	}
	nlog := zerolog.New(h)
	return &Context{
		Config: config,
		Log:    nlog,
	}, nil
}

func FilesDo(ctx *Context, dir string, fn func(ctx *Context, path string) error) error {
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
			ctx.Log.Info().Str("file", f.Name()).Msg("file already exists")
			os.Remove(pth)
			continue
		}

		e = fn(ctx, pth)
		if e != nil {
			ctx.Log.Info().Str("file", f.Name()).Err(e)
			os.Rename(pth, path.Join(dir, "error", f.Name()))
		} else {
			ctx.Log.Info().Str("file", f.Name()).Msg("file processed")
			os.Rename(pth, path.Join(dir, "old", f.Name()))
		}
	}
	return nil
}
