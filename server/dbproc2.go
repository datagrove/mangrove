package server

import (
	"context"
	"fmt"
	"strings"

	_ "github.com/jackc/pgx/v5/pgtype"
	_ "github.com/jackc/pgx/v5/pgxpool"
)

func (s *Server) Write(tableName string, data map[string]interface{}) error {
	conn := s.conn
	var columns, placeholders []string
	var values []interface{}
	for column, value := range data {
		columns = append(columns, column)
		placeholders = append(placeholders, fmt.Sprintf("$%d", len(values)+1))
		values = append(values, value)
	}

	// Build the upsert query
	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s) ON CONFLICT DO UPDATE SET ",
		tableName, strings.Join(columns, ", "), strings.Join(placeholders, ", "))

	// Add the update part of the query
	for i, column := range columns {
		query += fmt.Sprintf("%s = $%d", column, len(values)+1)
		values = append(values, data[column])
		if i < len(columns)-1 {
			query += ", "
		}
	}

	// Execute the upsert query
	_, err := conn.Exec(context.Background(), query, values...)
	if err != nil {
		return err
	}

	return nil
}

func (s *Server) Read1(tableName string, key map[string]interface{}) (map[string]interface{}, error) {
	conn := s.conn

	//defer conn.Close(context.Background())
	where := []string{}
	for k, v := range key {
		where = append(where, fmt.Sprintf("%s = %s", k, v))
	}
	query := fmt.Sprintf("SELECT * FROM %s LIMIT 1 where %s", tableName, strings.Join(where, " AND "))

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
	err = row.Scan(values...)
	if err != nil {
		return nil, err
	}

	// Store the field values in the result map using the column names as keys
	for i, column := range columns {
		result[column.Name] = *(values[i].(*interface{}))
	}

	// Print the result
	return result, nil
}
