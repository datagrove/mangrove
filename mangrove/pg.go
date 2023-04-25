package mangrove

import (
	"context"
	"database/sql"
	"fmt"

	sq "github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	_ "github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

// urlExample := "postgres://mangrove:mangrove@localhost:5432/mangrove"
type Db struct {
	conn *sql.DB
	qu   *sq.Queries
}

func NewDb(cn string) (*Db, error) {
	godotenv.Load()
	conn, err := sql.Open("postgres", cn)
	if err != nil {
		return nil, err
	}
	defer conn.Close()
	qu := sq.New(conn)
	return &Db{
		conn: conn,
		qu:   qu,
	}, nil
}

func (d *Db) GetCredential(id string) (*sq.Credential, error) {
	a, e := d.qu.GetCredential(context.Background(), id)
	if e != nil {
		fmt.Println(e)
	}

}
