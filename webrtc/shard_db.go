package main

import (
	"context"
	"database/sql"
	"os"

	_ "embed"

	_ "github.com/mattn/go-sqlite3"
)

//go:embed sqlite/schema.sql
var ddl string

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

type File struct {
	Type     string
	ReadKey  string
	WriteKey string
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
func (db *LogDb) Write(id int64, data []byte) error {
	_, err := db.db.Exec("insert or replace into block(id,data) VALUES(?);", id, data)
	return err
}
func (db *LogDb) Read(id int64, data []byte) ([]byte, error) {
	res, err := db.db.Query("select data from block where id =?;", id)
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
