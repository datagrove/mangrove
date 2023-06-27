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
    data BLOB
    );

create index tv on tuple(fid,rid,data)
`

type Tuple struct {
	Rid  int64
	Pid  int64
	Data []byte
}

type Partial = map[string]any

type FileMeta struct {
	FileId
	PublicRights int
	Name         string
	Type         string
	// is there just one owner key? not with capabilities, with capabilities these keys grant access, no further identitification needed.
	WriteKey []byte // people with
	ReadKey  []byte
	AdminKey []byte // right to change keys, other things in this record.
}

func update(f *FileMeta, upd Partial) {
	b, _ := cbor.Marshal(f)
	var asKeys = map[string]any{}
	cbor.Unmarshal(b, &asKeys)
	for k, v := range upd {
		asKeys[k] = v
	}
	b, _ = cbor.Marshal(asKeys)
	cbor.Unmarshal(b, f)
}

// fid:ns,rid:vs, data

// ns = update | tuple

// update:
// rid = time
// vs = peer

// tuple:
// rid = row id
// vs = version
// data = delta

// fid = 0 -> Directory
// rid = fileid
// data = readkey,writekey etc.

type LogDb struct {
	db *sql.DB
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
func (db *LogDb) Read(fid int64, rid int64) ([]byte, error) {
	res, err := db.db.Query("select data from tuple where fid=? and rid=?;", fid, rid)
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
func (db *LogDb) Scan(fid int64, from, to int64, limit int64, offset int64) ([]byte, error) {
	res, err := db.db.Query("select data from tuple where fid=? and rid between ? and ? limit ? offset ?;", fid, from, to, limit, offset)
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
func (db *LogDb) GetFile(id int64) (*FileMeta, error) {
	res, err := db.Read(0, id)
	if err != nil {
		return nil, err
	}
	var d FileMeta
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
