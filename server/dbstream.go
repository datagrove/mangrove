package server

import (
	"context"
	"errors"
	"log"
	"sync"
	"time"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/messaging"
)

// move tail to redis? might be faster to just keep in ram
// for notifications, we can
func (s *Server) DbApi2() {
	s.fcm = NewFcmBuffer()
	s.AddApi("write", true, func(r *Rpcp) (any, error) {
		var v struct {
			Table string         `json:"table,omitempty"`
			Data  map[string]any `json:"data,omitempty"`
		}
		sockUnmarshal(r.Params, &v)

		return true, Delete1(s.conn, v.Table, v.Data)
	})
	s.AddApi("read", true, func(r *Rpcp) (any, error) {
		var v struct {
			Table string         `json:"table,omitempty"`
			Data  map[string]any `json:"data,omitempty"`
		}
		sockUnmarshal(r.Params, &v)

		return true, Delete1(s.conn, v.Table, v.Data)
	})
	s.AddApij("notify", true, func(r *Rpcpj) (any, error) {
		var v Notify
		s.Notify(r.Session, &v)
		return nil, nil
	})
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
func (s *Server) Can(sess *Session, cap int, sid int64) bool {
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
	if !s.Can(sess, 1, v.Sid) {
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
