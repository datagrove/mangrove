package push

import (
	"encoding/json"
	"time"

	"firebase.google.com/go/messaging"
	"github.com/cornelk/hashmap"

	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

type LogId int64
type DeviceId = int64
type UserId int64

// The idea is that his is one per node
// the hashmap is here for future use in limiting push notifications
// but the shard can check it anyway. this online map gives a cluster wide look at who's online.
type NotifyDb struct {
	qu     *sql.DB
	online *hashmap.Map[UserId, *User]

	settings chan PushSettings
	log      chan LogChange
	join     chan Join
	query    chan Query
	push     chan bool // write to channel to kick off a batch push. the batch will then write into the channel itself
}

const (
	NameAndMessage = iota
	NameOnly
)

type DaySettings struct {
	Start int64
}
type TimeSettings struct {
	Day []DaySettings
}
type DeviceSettings struct {
	DeviceId
	LogSettings
}
type LogSettings struct {
	LogId
	TimeSettings
	Mute     int64
	MuteTags []string
}

type PushSettings struct {
	UserId
	LogId        // 0 means default
	UserSettings LogSettings
	Device       []DeviceSettings
	Log          []LogSettings
	Mode         int // time to turn back on.
}
type LogChange struct {
	LogId  int64
	Length int64
}
type Join struct {
	UserId
	LogId
	Leave bool
}

// query in background, query when coming online.
// query is broadcast, all answer it.
type Query struct {
	UserId
	DeviceId // need to send back to the proxy
}
type QueryResult struct {
	LogId  []int64
	Length []int64
}

func NewNotifyDb(path string, fn func(device int64, data []byte) error) (*NotifyDb, error) {
	sql, e := sql.Open("sqlite3", path)
	if e != nil {
		return nil, e
	}
	hm := hashmap.New[UserId, *User]()
	r := &NotifyDb{
		qu:     sql,
		online: hm,
	}

	sql.Exec("create table if not exists settings (user integer, log integer, mute integer, device integer)")
	sql.Exec("create table if not exists log (log integer, length integer)")
	sql.Exec("create table if not exists follow (user integer, log integer)")
	// lock screen notifications is an option
	sql.Exec("create table notify subject, body, image, device")

	ticker := time.NewTicker(2500 * time.Millisecond)
	done := make(chan bool)

	go func() {
		for {
			select {
			case <-done:
				return
			case _ = <-ticker.C:
				// push message batches
				sql.Exec("select")
			}
		}
	}()

	go func() {
		for {
			select {
			case s := <-r.settings:
				b, _ := json.Marshal(s)
				sql.Exec("insert or replace into settings (user, json) values (?)", s.UserId, b)
			case l := <-r.log:
				// update log
				sql.Exec("insert or replace into log (log, length) values (?, ?, ?)", l.LogId, l.Length)
			case j := <-r.join:
				if j.Leave {
					// remove from online
					sql.Exec("delete from follow where user=? and log?", j.UserId, j.LogId)
				} else {
					sql.Exec("insert or replace into follow (user, log) values (?, ?, ?)", j.UserId, j.LogId)
				}
			case q := <-r.query:
				sql.Exec("select log, length from follow join log on follow.log=log.log where user=?", q.UserId)

			default:

				o := &messaging.Message{
					Data: map[string]string{
						"score": "850",
					},
				}
				_ = o

			}

		}
	}()

	return r, nil
}

type User struct {
	length map[LogId]int64
	mute   map[LogId]bool
}
