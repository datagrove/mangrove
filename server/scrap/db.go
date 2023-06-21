package server

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func xx() {
	godotenv.Load()
	//urlExample := "postgres://postgres:@localhost:5432/posgres"
	db := os.Getenv("DB")
	conn, err := pgx.Connect(context.Background(), db)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	_, e := conn.Exec(context.Background(), "create table if not exists widgets (id serial primary key, name text, weight integer)")
	if e != nil {
		fmt.Fprintf(os.Stderr, "Unable to create table: %v\n", e)
		os.Exit(1)
	}
	_, e = conn.Exec(context.Background(), "insert into widgets (name, weight) values ($1, $2)", "Widget 1", 42)
	if e != nil {
		fmt.Fprintf(os.Stderr, "Unable to insert into table: %v\n", e)
		os.Exit(1)
	}

	_, e = conn.Exec(context.Background(), "Commit")
	if e != nil {
		fmt.Fprintf(os.Stderr, "Unable to commit: %v\n", e)
		os.Exit(1)
	}

	var name string
	var weight int64
	err = conn.QueryRow(context.Background(), "select name, weight from widgets where id=$1", 1).Scan(&name, &weight)
	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(name, weight)
}
