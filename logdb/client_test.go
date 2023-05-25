package logdb

import (
	"testing"

	"github.com/davecgh/go-spew/spew"
)

func Test_client(t *testing.T) {
	cl, e := NewMemoryClient(nil)
	if e != nil {
		t.Error(e)
	}
	defer cl.Close()

	rg := Open("", EmployeeTable, Select[int64](0, 1, 0, 0))
	rg.Update(Select[int64](0, 1, 0, 0))

	const insert = "hello"
	for i := 0; i < len(insert); i++ {
		st := rg.Wait()
		spew.Dump(rg)

		cl.Commit(func(ctx Transaction) error {
			//ctx.GetRoot(st.Cell(0, 1)).Insert(0, insert[i:i+1])
			ctx.GetRoot(st.Row(0).Fname).Insert(0, "hello")
			return nil // return error to rollback
		})

		// make some random update to a cell, maybe change the

	}
}

type Employee struct {
	// Id represents the unique identifier of an employee.
	Id    Cell `json:"id,omitempty"`
	Fname Cell `json:"fname,omitempty"`
	Lname Cell `json:"lname,omitempty"`
}

var EmployeeTable = TableDesc[Employee, int64]{
	"employee",
}
