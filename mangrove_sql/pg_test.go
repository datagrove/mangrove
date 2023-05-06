package mangrove

import (
	"fmt"
	"os"
	"strings"

	//"strings"
	"testing"

	//"github.com/jackc/pgconn"
	"context"

	"github.com/jackc/pgproto3"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"os/signal"
	//strings"
	"time"

	//"github.com/jackc/pgconn"
	"github.com/jackc/pglogrepl"
	//"github.com/jackc/pgproto3/v2"
)

// https://dbconvert.com/blog/postgresql-change-data-capture-cdc/
// postgresql.conf
// wal_level = logical
// max_replication_slots = 5
// max_wal_senders = 10
// /opt/homebrew/var/postgresql@14
// brew services restart postgresql@14
// PSQL_USER=postgres
// PSQL_PASS=postgres
// PSQL_DBNAME=mangrove
// PSQL_PORT=5432
// SELECT pg_create_logical_replication_slot('replication_slot', 'test_decoding');

// SELECT slot_name, plugin, slot_type, database, active, restart_lsn, confirmed_flush_lsn FROM pg_replication_slots;

// SELECT * FROM pg_publication_tables WHERE pubname='pub'
// alter user mangrove with replication  password 'mangrove';

func Test_pg(t *testing.T) {
	urlExample := "postgres://mangrove:mangrove@localhost:5432/mangrove"
	conn, err := pgx.Connect(context.Background(), urlExample)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	conn.Exec(context.Background(), "create table if not exists widgets(id serial primary key, name text unique, weight integer)")

	tx, err := conn.Begin(context.Background())
	if err != nil {
		t.Failed()
	}
	_, e := conn.Exec(context.Background(), "insert into widgets(name, weight) values('Acme 140', 175)")
	if e != nil {
		t.Failed()
	}
	e = tx.Commit(context.Background())
	if e != nil {
		t.Failed()
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

// Note that runtime parameter "replication=database" in connection string is obligatory
// replicaiton slot will not be created if replication=database is omitted

const CONN = "postgres://postgres:postgres@localhost/psql-streamer?replication=database"
const SLOT_NAME = "replication_slot"
const OUTPUT_PLUGIN = "pgoutput"
const INSERT_TEMPLATE = "create table t (id int, name text);"

var Event = struct {
	Relation string
	Columns  []string
}{}

func Test_pglog(t *testing.T) {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()
	c := "postgres://mangrove:mangrove@localhost:5432/mangrover?replication=database"
	conn, err := pgconn.Connect(ctx, c)
	if err != nil {
		panic(err)
	}
	defer conn.Close(ctx)

	// 1. Create table
	if _, err := conn.Exec(ctx, INSERT_TEMPLATE).ReadAll(); err != nil {
		fmt.Errorf("failed to create table: %v", err)
	}

	// 2. ensure publication exists
	if _, err := conn.Exec(ctx, "DROP PUBLICATION IF EXISTS pub;").ReadAll(); err != nil {
		fmt.Errorf("failed to drop publication: %v", err)
	}

	if _, err := conn.Exec(ctx, "CREATE PUBLICATION pub FOR ALL TABLES;").ReadAll(); err != nil {
		fmt.Errorf("failed to create publication: %v", err)
	}

	// 3. create temproary replication slot server
	if _, err = pglogrepl.CreateReplicationSlot(ctx, conn, SLOT_NAME, OUTPUT_PLUGIN, pglogrepl.CreateReplicationSlotOptions{Temporary: true}); err != nil {
		fmt.Errorf("failed to create a replication slot: %v", err)
	}

	var msgPointer pglogrepl.LSN
	pluginArguments := []string{"proto_version '1'", "publication_names 'pub'"}

	// 4. establish connection
	err = pglogrepl.StartReplication(ctx, conn, SLOT_NAME, msgPointer, pglogrepl.StartReplicationOptions{PluginArgs: pluginArguments})
	if err != nil {
		fmt.Errorf("failed to establish start replication: %v", err)
	}

	var pingTime time.Time
	for ctx.Err() != context.Canceled {
		if time.Now().After(pingTime) {
			if err = pglogrepl.SendStandbyStatusUpdate(ctx, conn, pglogrepl.StandbyStatusUpdate{WALWritePosition: msgPointer}); err != nil {
				fmt.Errorf("failed to send standby update: %v", err)
			}
			pingTime = time.Now().Add(10 * time.Second)
			//fmt.Println("client: please standby")
		}

		ctx, cancel := context.WithTimeout(ctx, time.Second*10)
		defer cancel()

		msg, err := conn.ReceiveMessage(ctx)
		if pgconn.Timeout(err) {
			continue
		}
		if err != nil {
			fmt.Errorf("something went wrong while listening for message: %v", err)
		}

		switch msg := msg.(type) {
		case *pgproto3.CopyData:
			switch msg.Data[0] {
			case pglogrepl.PrimaryKeepaliveMessageByteID:
			//	fmt.Println("server: confirmed standby")

			case pglogrepl.XLogDataByteID:
				walLog, err := pglogrepl.ParseXLogData(msg.Data[1:])
				if err != nil {
					fmt.Errorf("failed to parse logical WAL log: %v", err)
				}

				var msg pglogrepl.Message
				if msg, err = pglogrepl.Parse(walLog.WALData); err != nil {
					fmt.Errorf("failed to parse logical replication message: %v", err)
				}
				switch m := msg.(type) {
				case *pglogrepl.RelationMessage:
					Event.Columns = []string{}
					for _, col := range m.Columns {
						Event.Columns = append(Event.Columns, col.Name)
					}
					Event.Relation = m.RelationName
				case *pglogrepl.InsertMessage:
					var sb strings.Builder
					sb.WriteString(fmt.Sprintf("INSERT %s(", Event.Relation))
					for i := 0; i < len(Event.Columns); i++ {
						sb.WriteString(fmt.Sprintf("%s: %s ", Event.Columns[i], string(m.Tuple.Columns[i].Data)))
					}
					sb.WriteString(")")
					fmt.Println(sb.String())
				case *pglogrepl.UpdateMessage:
					var sb strings.Builder
					sb.WriteString(fmt.Sprintf("UPDATE %s(", Event.Relation))
					for i := 0; i < len(Event.Columns); i++ {
						sb.WriteString(fmt.Sprintf("%s: %s ", Event.Columns[i], string(m.NewTuple.Columns[i].Data)))
					}
					sb.WriteString(")")
					fmt.Println(sb.String())
				case *pglogrepl.DeleteMessage:
					var sb strings.Builder
					sb.WriteString(fmt.Sprintf("DELETE %s(", Event.Relation))
					for i := 0; i < len(Event.Columns); i++ {
						sb.WriteString(fmt.Sprintf("%s: %s ", Event.Columns[i], string(m.OldTuple.Columns[i].Data)))
					}
					sb.WriteString(")")
					fmt.Println(sb.String())
				case *pglogrepl.TruncateMessage:
					fmt.Println("ALL GONE (TRUNCATE)")
				}
			}
		default:
			fmt.Printf("received unexpected message: %T", msg)
		}
	}
}
