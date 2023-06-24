package main

import (
	"context"
	"database/sql"

	_ "embed"

	_ "github.com/mattn/go-sqlite3"

	"github.com/datagrove/mangrove/webrtc/sqlite/dglite"
)

//go:embed sqlite/schema.sql
var ddl string

func install() error {
	ctx := context.Background()

	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		return err
	}

	// create tables
	if _, err := db.ExecContext(ctx, ddl); err != nil {
		return err
	}
	q := dglite.New(db)

	q.GetFile(ctx, 1)

}
