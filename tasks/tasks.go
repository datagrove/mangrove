package tasks

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path"
	"strconv"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/tailscale/hujson"
)

//var Job map[string]*Job

// func (s *server.Server) AddJob(job *Job) {
// 	//s.Job[job.Name] = job
// }

type Job struct {
	Name   string
	Schema string
	Run    func(*Context, string) error
}

// Containers are like shared folders
type Container struct {
	Gpg        string                    `json:"gpg,omitempty"`
	Connection map[string]*SshConnection `json:"connection,omitempty"`
}

type Context struct {
	Container *Container
	Store     string
	Artifacts string
	// each task can have its own log (since logs are sequential and tasks can be parallel)
	NextTask int64
}
type Task struct {
	c         *Context
	Artifacts string
	Log       zerolog.Logger
}

func (c *Context) TaskLog() *Task {
	n := atomic.AddInt64(&c.NextTask, 1)
	a := path.Join(c.Artifacts, fmt.Sprintf("%d", n))
	h, e := os.Create(path.Join(c.Artifacts, fmt.Sprintf("log%d.jsonl", n)))
	if e != nil {
		// we can't continue if we can't create a log file
		log.Fatal(e)
	}
	r := &Task{
		c: c,
		// files from this task
		Artifacts: a,
		Log:       zerolog.New(h),
	}
	return r
}

// the idea here is to add a few different commands for standalone bespoke servers
//	should this return a cobra command?
// maybe there should be a default proxy server as well

func Unmarshal(b []byte, v interface{}) error {
	ast, err := hujson.Parse(b)
	if err != nil {
		return err
	}
	ast.Standardize()
	return json.Unmarshal(ast.Pack(), v)
}

func OpenContainer(home string, container string) (*Context, error) {

	ct, e := LoadContainer(container)
	if e != nil {
		return nil, e
	}
	artifacts := path.Join(container, "log", uuid.NewString())
	os.MkdirAll(artifacts, 0700)

	return &Context{

		Artifacts: artifacts,
		Store:     container,
		Container: ct,
	}, nil
}
func LoadContainer(dir string) (*Container, error) {
	var j Container
	b, e := os.ReadFile(path.Join(dir, "index.jsonc"))
	if e != nil {
		return nil, e
	}
	e = Unmarshal(b, &j)
	if e != nil {
		return nil, e
	}
	j.Gpg = path.Join(dir, j.Gpg)
	// resolve the files relative to the container
	for _, v := range j.Connection {
		v.Gpg = path.Join(dir, v.Gpg)
	}

	return &j, nil
}

// b, e := os.ReadFile(path.Join(dir, "index.jsonc"))
// if e != nil {
// 	return nil, e
// }
// Unmarshal(b, &j)
// func initialize(dir string) {
// 	os.MkdirAll(dir, 0777) // permissions here are not correct, should be lower
// 	os.WriteFile(path.Join(dir, "index.jsonc"), []byte(`{
// 		"Https": ":5078",
// 		"Sftp": ":5079",
// 	}`), 0777)
// }

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
