package server

import (
	"context"
	"fmt"
	"log"

	"github.com/datagrove/mangrove/logdb/logdb"
	"github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	"github.com/fxamacker/cbor/v2"
	"github.com/jackc/pgx/v5"
)

// we should allow sites to have their own bucket?
// whatever the bucket we need to be able to write to it.
// we could have drivers.

// write as many sites as you want, will return

// move tail to redis? might be faster to just keep in ram
// for notifications, we can
func (s *Server) DbApi2() {
	var e error
	s.fcm, e = NewFcmBuffer()
	if e != nil {
		log.Printf("Push is disabled. Configure the .env file and restart to enable")
	}

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
		var v []logdb.treamTx
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

func (s *Server) Commit(sess *Session, tx []logdb.StreamTx) ([]logdb.StreamTxResult, error) {
	one := func(v *logdb.StreamTx, r *logdb.StreamTxResult) error {
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

	result := make([]logdb.StreamTxResult, len(tx))
	for i := range tx {
		one(&tx[i], &result[i])
	}
	return result, nil

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

*/
