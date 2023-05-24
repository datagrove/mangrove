package server

import (
	"context"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/messaging"
	"github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	"github.com/fxamacker/cbor/v2"
	"github.com/jackc/pgx/v5"
)

// we should allow sites to have their own bucket?
// whatever the bucket we need to be able to write to it.
// we could have drivers.

// write as many sites as you want, will return

// Locks are just sites for now?
type StreamLock struct {
	Sid    int64
	Key    []byte // not used
	Length int64
}

// the write always succeeds
// the lock only succeeds if the length is correct
type StreamTx struct {
	Lock  []StreamLock
	Write []struct {
		Sid  int64
		Data []byte
	}
}
type StreamTxResult struct {
	Offset       []int64
	WriteSuccess bool
	LockSuccess  bool
}

// move tail to redis? might be faster to just keep in ram
// for notifications, we can
func (s *Server) DbApi2() {
	s.fcm = NewFcmBuffer()

	// we should return redirects? what is cors going to do to us?
	// we should get the tail when we connect or join, the rest we should read directly.
	s.AddApi("read", false, func(r *Rpcp) (any, error) {
		var v struct {
			Sid    int64 `json:"sid,omitempty"`
			Offset int64 `json:"offset,omitempty"`
			Length int64 `json:"length,omitempty"`
		}
		sockUnmarshal(r.Params, &v)
		key := fmt.Sprintf("%d/%d", v.Sid, v.Offset)
		blk, e := s.qu.SelectR2(context.Background(), key)
		return blk, e
	})

	s.AddApi("tx", false, func(r *Rpcp) (any, error) {
		var v []StreamTx
		sockUnmarshal(r.Params, &v)
		return s.Commit(r.Session, v)
	})

	s.AddApij("notify", true, func(r *Rpcpj) (any, error) {
		var v Notify
		s.Notify(r.Session, &v)
		return nil, nil
	})
	s.AddApi("join", true, func(r *Rpcp) (any, error) {
		var v struct {
			Sid  int64
			Mute cbor.RawMessage
		}
		var e error
		sockUnmarshal(r.Params, &v)
		_ = s.qu.DeletePush(context.Background(), mangrove_sql.DeletePushParams{
			Sid: v.Sid,
			Oid: r.Session.Oid,
		})
		e = s.qu.InsertPush(context.Background(), mangrove_sql.InsertPushParams{
			Sid:  v.Sid,
			Oid:  r.Session.Oid,
			Mute: v.Mute,
		})
		return nil, e
	})
}

const (
	CanWrite = 2
	CanRead  = 1
	CanAdmin = 4
)

func (s *Server) Commit(sess *Session, tx []StreamTx) ([]StreamTxResult, error) {
	one := func(v *StreamTx, r *StreamTxResult) error {
		update := func() error {
			type Info struct {
				Length     int64
				LastCommit int64
			}
			info := make(map[int64]*Info)
			load := func(sid int64) (*Info, error) {
				if a, ok := info[sid]; ok {
					return a, nil
				}
				d, e := s.qu.SelectSite(context.Background(), sid)
				if e != nil {
					return nil, e
				}
				return &Info{Length: d.Length, LastCommit: d.Lastcommit}, nil
			}
			// if the writes don't succeed, don't try the locks
			for _, l := range v.Write {
				a, e := load(l.Sid)
				if e != nil {
					return e
				}
				_ = a
			}

			for _, v := range v.Write {
				offset := info[v.Sid].Length
				for i := 0; i < len(v.Data); i += 1000 {
					key := fmt.Sprintf("%d/%d", v.Sid, offset)
					blk, e := s.qu.SelectR2(context.Background(), key)
					if e != nil {
						return e
					}
					e = s.qu.InsertR2(context.Background(), mangrove_sql.InsertR2Params{
						Key:   "",
						Value: blk,
					})
				}
			}
			r.WriteSuccess = true
			// at this point  we will try the commit, only return nil

			// if the writes all succeeded, then try the locks
			// should probably do this entirely inside stored procedure.

			// we probably need serializable for this. can we have lower for single site?

			// a problem: we could succeed in all the writes but fail anyway due to database locks

			ok := true
			for _, l := range v.Lock {
				x, e := load(l.Sid)
				if e != nil || x.LastCommit != l.Length {
					ok = false
					break
				}
			}
			r.LockSuccess = ok
			if ok {
				for _, l := range v.Lock {
					info[l.Sid].LastCommit = l.Length
				}
			}

			// update the site counters
			for k, ix := range info {
				s.qu.UpdateLength(context.Background(), mangrove_sql.UpdateLengthParams{
					Sid:        k,
					Length:     ix.Length,
					Lastcommit: ix.LastCommit,
				})
			}
			return nil
		}

		for _, l := range v.Lock {
			if !s.Can(sess, l.Sid, 2) {
				return errNoPermission
			}
		}
		for _, l := range v.Write {
			if !s.Can(sess, l.Sid, 2) {
				return errNoPermission
			}
		}

		tx, e := s.conn.BeginTx(context.Background(), pgx.TxOptions{
			IsoLevel:       "",
			AccessMode:     "",
			DeferrableMode: "",
		})
		if e != nil {
			return e
		}
		e = update()
		if e != nil {
			tx.Rollback(context.Background())
			return e
		} else {
			return tx.Commit(context.Background())
		}
	}

	result := make([]StreamTxResult, len(tx))
	for i := range tx {
		one(&tx[i], &result[i])
	}
	return result, nil

}

// typically you might publish to a topic, and retrieve the subscribers to that topic
// but you also need wild cards and mute? data leaking here of course
type Notify struct {
	Sid      int64
	Topic    string
	Subject  string // a thing? maybe for email
	Message  string
	ImageURL string
}
type NotifySettings struct {
}

// how do we rate limit?
func (s *Server) Can(sess *Session, sid int64, cap int) bool {
	return true
}

var errNoPermission = errors.New("no permission")

func (s *Server) SendPush(v *Notify, data []byte) {
	o := &messaging.Notification{
		Title:    v.Subject,
		Body:     v.Message,
		ImageURL: v.ImageURL,
	}
	_ = o
}
func (s *Server) Notify(sess *Session, v *Notify) error {
	if !s.Can(sess, v.Sid, 1) {
		return errNoPermission
	}
	a, e := s.qu.SelectPush(context.Background(), v.Sid)
	if e != nil {
		return e
	}
	for _, r := range a {
		if len(r.Mute) > 0 {
			continue
		}
		s.SendPush(v, r.Mute)
	}
	return nil
}

// FcmBuffer batches all incoming push messages and send them periodically.
type FcmBuffer struct {
	fcmClient        *messaging.Client
	dispatchInterval time.Duration
	batchCh          chan *messaging.Message
	wg               sync.WaitGroup
}

func NewFcmBuffer() *FcmBuffer {
	// There are different ways to add credentials on init.
	// if we have a path to the JSON credentials file, we use the GOOGLE_APPLICATION_CREDENTIALS env var
	//os.Setenv("GOOGLE_APPLICATION_CREDENTIALS", c.Firebase.Credentials)
	// or pass the file path directly
	//opts := []option.ClientOption{option.WithCredentialsFile("creds.json")}

	// if we have a raw JSON credentials value, we use the FIREBASE_CONFIG env var
	//os.Setenv("FIREBASE_CONFIG", "{...}")

	// or we can pass the raw JSON value directly as an option
	//opts := []option.ClientOption{option.WithCredentialsJSON([]byte("{...}"))}

	app, err := firebase.NewApp(context.Background(), nil)
	if err != nil {
		log.Fatalf("new firebase app: %s", err)
	}

	fcmClient, err := app.Messaging(context.TODO())
	if err != nil {
		log.Fatalf("messaging: %s", err)
	}
	return &FcmBuffer{
		fcmClient:        fcmClient,
		dispatchInterval: 5 * time.Second,
		batchCh:          make(chan *messaging.Message, 1000),
	}
}

func (b *FcmBuffer) SendPush(msg *messaging.Message) {
	b.batchCh <- msg
}

func (b *FcmBuffer) sender() {
	defer b.wg.Done()

	// set your interval
	t := time.NewTicker(b.dispatchInterval)

	// we can send up to 500 messages per call to Firebase
	messages := make([]*messaging.Message, 0, 500)

	defer func() {
		t.Stop()

		// send all buffered messages before quit
		b.sendMessages(messages)

		log.Println("batch sender finished")
	}()

	for {
		select {
		case m, ok := <-b.batchCh:
			if !ok {
				return
			}

			messages = append(messages, m)
		case <-t.C:
			b.sendMessages(messages)
			messages = messages[:0]
		}
	}
}

func (b *FcmBuffer) Run() {
	b.wg.Add(1)
	go b.sender()
}

func (b *FcmBuffer) Stop() {
	close(b.batchCh)
	b.wg.Wait()
}

func (b *FcmBuffer) sendMessages(messages []*messaging.Message) {
	if len(messages) == 0 {
		return
	}
	batchResp, err := b.fcmClient.SendAll(context.TODO(), messages)
	log.Printf("batch response: %+v, err: %s \n", batchResp, err)
}

// By default, you’ll receive email notifications when you join a Slack workspace and haven’t enabled mobile notifications. When you’re not active in Slack, you can receive email notifications to alert you of mentions, DMs and replies to threads you're following. These notifications are bundled and sent once every 15 minutes or once an hour, depending on your preferences.

/*
	s.AddApi("writet", true, func(r *Rpcp) (any, error) {
		var v struct {
			Table string         `json:"table,omitempty"`
			Data  map[string]any `json:"data,omitempty"`
		}
		sockUnmarshal(r.Params, &v)

		return true, Delete1(s.conn, v.Table, v.Data)
	})
	s.AddApi("readt", true, func(r *Rpcp) (any, error) {
		var v struct {
			Table string         `json:"table,omitempty"`
			Data  map[string]any `json:"data,omitempty"`
		}
		sockUnmarshal(r.Params, &v)

		return nil,nil
	})
*/
