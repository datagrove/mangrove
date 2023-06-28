package push

import (
	"context"
	"errors"
	"log"
	"sync"
	"time"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/messaging"
)

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

// FcmBuffer batches all incoming push messages and send them periodically.
type FcmBuffer struct {
	FcmClient        *messaging.Client
	DispatchInterval time.Duration
	BatchCh          chan *messaging.Message
	Wg               sync.WaitGroup
}

func NewFcmBuffer() (*FcmBuffer, error) {
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
		return nil, err
	}

	fcmClient, err := app.Messaging(context.TODO())
	if err != nil {
		return nil, err
	}
	return &FcmBuffer{
		FcmClient:        fcmClient,
		DispatchInterval: 5 * time.Second,
		BatchCh:          make(chan *messaging.Message, 1000),
	}, nil
}

func (b *FcmBuffer) SendPush(msg *messaging.Message) {
	b.BatchCh <- msg
}

func (b *FcmBuffer) sender() {
	defer b.Wg.Done()

	// set your interval
	t := time.NewTicker(b.DispatchInterval)

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
		case m, ok := <-b.BatchCh:
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
	b.Wg.Add(1)
	go b.sender()
}

func (b *FcmBuffer) Stop() {
	close(b.BatchCh)
	b.Wg.Wait()
}

func (b *FcmBuffer) sendMessages(messages []*messaging.Message) {
	if len(messages) == 0 {
		return
	}
	batchResp, err := b.FcmClient.SendAll(context.TODO(), messages)
	log.Printf("batch response: %+v, err: %s \n", batchResp, err)
}

var errNoPermission = errors.New("no permission")

// func (s *NotifyDb) SendPush(v *Notify, data []byte) {

// }
// func (s *NotifyDb) Notify(sess *Session, v *Notify) error {

// 	a, e := s.qu.SelectPush(context.Background(), v.Sid)
// 	if e != nil {
// 		return e
// 	}
// 	for _, r := range a {
// 		if len(r.Mute) > 0 {
// 			continue
// 		}
// 		s.SendPush(v, r.Mute)
// 	}
// 	return nil
// }
