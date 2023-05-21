package server

import (
	"context"
	"fmt"
	"strings"

	"github.com/fxamacker/cbor/v2"
	_ "github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/pgxpool"
)

func (s *Server) DbApi() {
	s.AddApi("delete1", true, func(r *Rpcp) (any, error) {
		var v struct {
			Table string         `json:"table,omitempty"`
			Data  map[string]any `json:"data,omitempty"`
		}
		sockUnmarshal(r.Params, &v)

		return true, Delete1(s.conn, v.Table, v.Data)
	})
	s.AddApi("insert1", true, func(r *Rpcp) (any, error) {
		var v struct {
			Table string         `json:"table,omitempty"`
			Data  map[string]any `json:"data,omitempty"`
		}
		sockUnmarshal(r.Params, &v)

		return true, Insert1(s.conn, v.Table, v.Data)
	})
	s.AddApi("update1", true, func(r *Rpcp) (any, error) {
		var v struct {
			Table string         `json:"table,omitempty"`
			Key   []string       `json:"key,omitempty"`
			Data  map[string]any `json:"data,omitempty"`
		}
		sockUnmarshal(r.Params, &v)

		return true, Update1(s.conn, v.Table, v.Key, v.Data)
	})
	s.AddApi("insert1", true, func(r *Rpcp) (any, error) {
		var v struct {
			Snapshot []byte
			Begin    []byte
			End      []byte
		}
		sockUnmarshal(r.Params, &v)

		var outv struct {
			Snapshot []byte `json:"snapshot"`
		}
		return &outv, nil
	})
	s.AddApi("read1", true, func(r *Rpcp) (any, error) {
		var v struct {
			Table string         `json:"table,omitempty"`
			Data  map[string]any `json:"data,omitempty"`
		}
		sockUnmarshal(r.Params, &v)

		return Read1(s.conn, v.Table, v.Data)
	})
}

func (s *Server) DangerousExec(q string) error {
	_, err := s.Db.conn.Exec(context.Background(), q)
	return err
}

func Insert1(conn *pgxpool.Pool, tableName string, v map[string]any) error {

	var columns, placeholders []string
	var values []interface{}
	//var kyv []interface{}
	for column, value := range v {
		columns = append(columns, column)
		placeholders = append(placeholders, fmt.Sprintf("$%d", len(values)+1))
		values = append(values, value)
	}

	// Build the upsert query
	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s) ",
		tableName, strings.Join(columns, ", "), strings.Join(placeholders, ", "))

	// Execute the upsert query
	_, err := conn.Exec(context.Background(), query, values...)
	if err != nil {
		return err
	}

	return nil
}
func Delete1(conn *pgxpool.Pool, tableName string, v map[string]any) error {
	var columns, plk []string
	var values []interface{}
	for column, value := range v {
		columns = append(columns, column)
		plk = append(plk, fmt.Sprintf("%s = $%d", column, len(values)+1))
		values = append(values, value)
	}

	// Build the upsert query
	query := fmt.Sprintf("delete from %s where %s",
		tableName, strings.Join(plk, " AND "))

	// Execute the upsert query
	_, err := conn.Exec(context.Background(), query, values...)
	if err != nil {
		return err
	}

	return nil
}
func Update1(conn *pgxpool.Pool, tableName string, key []string, v map[string]any) error {
	keym := map[string]bool{}
	for _, k := range key {
		keym[k] = true
	}

	var columns, placeholders, plk []string
	var values []interface{}
	//var kyv []interface{}
	for column, value := range v {
		columns = append(columns, column)
		if keym[column] {
			plk = append(plk, fmt.Sprintf("%s = $%d", column, len(values)+1))
		} else {
			placeholders = append(placeholders, fmt.Sprintf("%s = $%d", column, len(values)+1))
		}
		values = append(values, value)
	}

	// Build the upsert query
	query := fmt.Sprintf("UPDATE %s SET %s  where %s",
		tableName, strings.Join(placeholders, ", "), strings.Join(plk, " AND "))

	// Execute the upsert query
	_, err := conn.Exec(context.Background(), query, values...)
	if err != nil {
		return err
	}

	return nil
}

func (s *Server) Read1(tableName string, key map[string]interface{}) ([]byte, error) {
	return Read1(s.conn, tableName, key)
}
func Read1(conn *pgxpool.Pool, tableName string, key map[string]interface{}) ([]byte, error) {

	//defer conn.Close(context.Background())
	where := []string{}
	for k, v := range key {
		where = append(where, fmt.Sprintf("%s = '%v'", k, v))
	}
	query := fmt.Sprintf("SELECT * FROM %s where %s", tableName, strings.Join(where, " AND "))

	// Execute the query and retrieve the result
	row, err := conn.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}

	// Get the column names from the query result
	columns := row.FieldDescriptions()

	// Prepare the map to store the result
	result := make(map[string]interface{})

	// Iterate over the columns and retrieve the field values
	values := make([]interface{}, len(columns))
	for i := range columns {
		values[i] = new(interface{})
	}

	// Scan the row into the map
	row.Next()
	err = row.Scan(values...)
	if err != nil {
		return nil, err
	}

	// Store the field values in the result map using the column names as keys
	for i, column := range columns {
		result[column.Name] = *(values[i].(*interface{}))
	}
	b, err := cbor.Marshal(result)
	if err != nil {
		return nil, err
	}
	// Print the result
	return b, nil
}
