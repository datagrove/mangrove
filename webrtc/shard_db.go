package main

import (
	"context"
	"database/sql"
	"os"

	_ "embed"

	"github.com/fxamacker/cbor/v2"
	_ "github.com/mattn/go-sqlite3"
)

// pid is a pointer id, from a tuple it points to a stream, from a stream it points to the security group
// rids use the top byte to indicate peer and core, 48 bits are time, but incremented to ensure uniqueness.
// the msb = 255 is reserved for system records.
// system records are security groups, streams, devices, users
const ddl = `
create table tuple (
    rid INTEGER PRIMARY KEY,
    pid integer,
    length blob
    );
create table toast (
	sid INTEGER PRIMARY KEY,
	data blob
);
create index tv on tuple(fid,rid,data)
`

type UserId = uint64
type Tuple struct {
	Rid    uint64
	Pid    uint64
	Length uint64
}

// the sync tree is sorted [date,files]
// we can use the subscriber record to find all the subscribed files that have changed when background sync is called.
// how is this sharded? duplicate the update tree on each peer. using a join tree we can use multiple cores if we want. one batch to update.

// high 48 bits are the RID
// the low 16 bits hold left-full trees of the sequence records
// note that they are only full conceptually; trims may reduce the range of actual bytes in the range to 0.
type Toast struct {
	Sid  uint64
	Data []byte
}

// Trim is lazy, a record will be returned even if it has been trimmed, it may return the former data, or 0's.
type Trim struct {
	Rid uint64
	At  uint64
}

const (
	M_security_partition = iota
	M_stream
	M_device
	M_user
)

type SecurityPartition struct {
	FileId
	PublicRights int
	Name         string
	Type         string
	// is there just one owner key? not with capabilities, with capabilities these keys grant access, no further identitification needed.
	WriteKey []byte // people with
	ReadKey  []byte
	AdminKey []byte // right to change keys, other things in this record.
}

type LogDb struct {
	db *sql.DB
}

func (db *LogDb) GetWatch(d DeviceId) []StreamId {
	return nil
}

func NewLogDb(path string) (*LogDb, error) {
	_, e := os.Stat(path)
	ctx := context.Background()

	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}

	// create tables
	if e != nil {
		if _, err := db.ExecContext(ctx, ddl); err != nil {
			return nil, err
		}
	}

	return &LogDb{db}, nil
}

// read
func (db *LogDb) Read(rid uint64) ([]byte, error) {
	res, err := db.db.Query("select data from tuple where rid=?;", rid)
	if err != nil {
		return nil, err
	}
	if !res.Next() {
		return nil, nil
	}
	var d []byte
	if err := res.Scan(&d); err != nil {
		return nil, err
	}
	return d, nil
}
func (db *LogDb) Scan(rid int64, from, to int64, limit int64, offset int64) ([][]byte, error) {
	res, err := db.db.Query("select data from toast where fid=? and rid between ? and ? limit ? offset ?;", rid, from, to, limit, offset)
	if err != nil {
		return nil, err
	}
	var o [][]byte
	var d []byte
	for res.Next() {
		if err := res.Scan(&d); err != nil {
			return nil, err
		}
		o = append(o, d)
	}
	return o, nil
}

type Tx struct {
	db *LogDb
	tx *sql.Tx
}

func (db *LogDb) Begin() (*Tx, error) {
	x, e := db.db.Begin()
	if e != nil {
		return nil, e
	}
	return &Tx{db, x}, nil
}

func (db *Tx) Write(fid int64, rid int64, data []byte) error {
	_, err := db.db.db.Exec("insert or replace into tuple(fid,rid,data) VALUES(?);", fid, rid, data)
	return err
}
func (db *Tx) Commit() error {
	return db.tx.Commit()
}

// files are
func (db *LogDb) GetFile(id uint64) (*SecurityPartition, error) {
	res, err := db.Read(id)
	if err != nil {
		return nil, err
	}
	var d SecurityPartition
	cbor.Unmarshal(res, &d)
	return &d, nil
}

/*
	func (db *LogDb) OpenFile(id int64) (*File, error) {
		res, err := db.db.Query("select data from block where id =?;", id)
		if err != nil {
			return nil, err
		}
		if !res.Next() {
			return nil, nil
		}
		var d File
		if err := res.Scan(&d.Type); err != nil {
			return nil, err
		}
		return &d, nil
	}

	func (db *LogDb) CreateFile(f *File) (int, error) {
		res, err := db.db.Exec("INSERT INTO file(type) VALUES(?);", f.Type)
		if err != nil {
			return 0, err
		}

		var id int64
		if id, err = res.LastInsertId(); err != nil {
			return 0, err
		}
		return int(id), nil
	}
*/
