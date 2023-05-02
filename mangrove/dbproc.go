package mangrove

import (
	"context"
	"fmt"
	"sync"

	"github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	"github.com/datagrove/mangrove/message"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

const (
	demo123 = "$2a$12$moAgCg/c0OUQyS67TktVJehoY71wxds3syPOvKwNNONfabXGwGyPG"
)

func (s *Server) CloseStream(fid int64) {
	s.muStream.Lock()
	defer s.muStream.Unlock()
	delete(s.Stream, fid)
}
func (s *Server) OpenStream(fid int64) (*Stream, error) {
	s.muStream.Lock()
	defer s.muStream.Unlock()
	if stream, ok := s.Stream[fid]; ok {
		return stream, nil
	}
	stream := &Stream{
		mu:     sync.Mutex{},
		fid:    fid,
		listen: map[*Session]int64{},
	}
	s.Stream[fid] = stream
	return stream, nil
}

func Dbproc(mg *Server) error {

	// add typesafe query apis
	// server / organization / database / table-or-$ / if $ then $/path
	mg.AddApi("open", true, func(r *Rpcp) (any, error) {
		var v OpenDb
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return mg.Open(r.Session, &v)
	})
	mg.AddApi("close", true, func(r *Rpcp) (any, error) {
		var v struct {
			Handle int64
		}
		sockUnmarshal(r.Params, &v)
		return true, mg.Close(r.Session, v.Handle)
	})

	mg.AddApi("commit", true, func(r *Rpcp) (any, error) {
		var v Transaction
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return true, mg.Commit(r.Session, &v)
	})
	mg.AddApi("read", true, func(r *Rpcp) (any, error) {
		var v ReadLog
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return mg.Read(r.Session, &v)
	})
	mg.AddApi("append", true, func(r *Rpcp) (any, error) {
		var v Append
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return true, mg.Append(r.Session, &v)
	})
	mg.AddApi("trim", true, func(r *Rpcp) (any, error) {
		var v Trim
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return true, mg.Trim(r.Session, &v)
	})

	return nil
}

// two stage api because we might want to use things other than socket apis
type ReadLog struct {
	Handle int64
	From   int64
	To     int64
}

// api's already hold session locks?
func (s *Server) Read(sess *Session, read *ReadLog) (any, error) {
	// see if we have permission
	h, ok := sess.Handle[read.Handle]
	if !ok {
		return nil, fmt.Errorf("invalid handle")
	}
	a, e := s.Db.qu.Read(context.Background(), mangrove_sql.ReadParams{
		Db:      h.Stream.db,
		Fid:     h.Stream.fid,
		Start:   read.From,
		Start_2: read.To,
	})
	return a, e
}

type OpenDb struct {
	Auth      string `json:"auth"` // dg://server/organization/database/stream
	Starting  int64  // if starting is 0 or too old, return a snapshot.
	Subscribe bool
}

func (s *Server) StoreFactor(sess *Session) error {
	s.Db.qu.InsertCredential(context.Background(), mangrove_sql.InsertCredentialParams{
		Org: sess.Name,
		Name: pgtype.Text{
			String: "",
			Valid:  false,
		},
		Type: pgtype.Text{
			String: "",
			Valid:  false,
		},
		Value: []byte{},
	})
	return nil
}

func (s *Server) PasswordLoginInternal(sess *Session, user, password string, pref int) bool {
	a, e := s.Db.qu.SelectOrg(context.Background(), user)
	if e != nil {
		return false
	}
	c, e := GenerateRandomString(32)
	if e != nil {
		return false
	}
	code, e := message.CreateCode()
	if e != nil {
		return false
	}
	// look up the credentials and take the highest priority one
	// return alternatives.
	cr, _ := s.Db.qu.SelectCredential(context.Background(), user)
	// we might not have a credential and that might be ok.
	opt := []string{}
	var typ, address string
	for _, v := range cr {
		opt = append(opt, v.Type.String, string(v.Value))
		typ = v.Type.String
		address = string(v.Value)
	}
	if pref > 0 && pref <= len(cr) {
		i := pref - 1
		typ = opt[i*2]
		address = opt[i*2+1]
	}

	sess.ChallengeInfo = ChallengeInfo{
		LoginInfo: &LoginInfo{
			Error:  0,
			Cookie: c,
			Home:   s.AfterLogin,
		},
		ChallengeNotify: ChallengeNotify{
			ChallengeType:   typ,
			ChallengeSentTo: address,
			OtherOptions:    opt,
		},
		Challenge: code,
	}
	e = bcrypt.CompareHashAndPassword([]byte(a.Password), []byte(password))
	return e == nil
}
func (mg *Server) Open(sess *Session, w *OpenDb) (int64, error) {
	//ucan.Parse(w.Auth)
	return 0, nil
}

func (s *Server) Close(sess *Session, handle int64) error {
	stream, ok := sess.Handle[handle]
	if !ok {
		return nil
	}

	stream.mu.Lock()
	defer stream.mu.Unlock()
	delete(stream.listen, sess)
	if len(stream.listen) == 0 {
		s.CloseStream(stream.fid)
	}
	delete(sess.Handle, handle)
	return nil
}

var badHandle = fmt.Errorf("invalid handle")

// when packed into the log, we can map the Handles to Fid's
// but then why not use fid's to begin with?
type Transaction struct {
	Locks  []Lock
	Handle []int64
	Start  []int
	Fn     []*Functor
}

// key = server://org/db/table/...[primary key]/column/after
type Functor struct {
	Op    string // insert,  delete, update,
	Key   []any  // cbor byte[] for update the key needs to include the column, #after if vector
	Value []byte // argument to functor: f(old, value) -> new
}

// locks only advance. The lock succeeds if the proposed serial number is +1 from existing one.
// if any lock fails, the commit fails
// locks are meta data leaked to the server, so plan accordingly.
// locks are published in the stream
type Lock struct {
	Handle int64
	Name   []byte //
	Serial int64
}

func (mg *Server) Commit(sess *Session, tx *Transaction) error {
	b := context.Background()
	// see if we have permission
	for _, f := range tx.Handle {
		hx, ok := sess.Handle[f]
		if !ok || hx.flags&1 == 0 {
			return badHandle
		}
	}

	// see if we have locks; these have to take postgres locks
	for _, lock := range tx.Locks {
		_ = lock
	}

	// we can't really apply the functors, we just pack them into the main log
	// should we write open transactions to the log or substitute the path?
	tc, e := mg.Db.conn.Begin(b)
	if e != nil {
		return e
	}

	tc.Rollback(b)
	return tc.Commit(b)
}

type Append struct {
	Handle int64
	At     int64 `json:"at"`
	Root   bool
	Data   []byte `json:"data"`
}

// we can identify the snapshot with the device did of the client
func (mg *Server) Append(sess *Session, append *Append) error {
	x, ok := sess.Handle[append.Handle]
	if !ok || x.flags&2 == 0 {
		return badHandle
	}
	e := mg.Db.qu.Write(context.Background(), mangrove_sql.WriteParams{
		Db:    x.Stream.db,
		Fid:   x.Stream.fid,
		Start: append.At,
		Data:  append.Data,
	})

	return e
}

type Trim struct {
	Handle int64
	From   int64 `json:"from"`
	To     int64 `json:"to"`
}

func (mg *Server) Trim(sess *Session, trim *Trim) error {
	x, ok := sess.Handle[trim.Handle]
	if !ok || x.flags&2 == 0 {
		return badHandle
	}
	e := mg.Db.qu.Trim(context.Background(), mangrove_sql.TrimParams{
		Db:      x.Stream.db,
		Fid:     x.Stream.fid,
		Start:   trim.From,
		Start_2: trim.To,
	})
	return e
}
