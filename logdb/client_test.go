package logdb

import (
	"testing"

	"github.com/davecgh/go-spew/spew"
)

func Test_client(t *testing.T) {
	cl, e := NewClient("process", nil)
	if e != nil {
		t.Error(e)
	}
	defer cl.Close()

	rg := Open("", EmployeeTable, Select[int64](0, 1, 0, 0))
	rg.Update(Select[int64](0, 1, 0, 0))

	for {
		st := rg.Wait()
		spew.Dump(rg)

		cl.Commit(func(ctx Transaction) error {
			ctx.GetRoot(st.Cell(0, 1)).Insert(0, "hello")
			return nil // return error to rollback
		})

		// make some random update to a cell, maybe change the

	}
}

type Employee struct {
	Id    Cell
	Fname Cell
	Lname Cell
}

var EmployeeTable = TableDesc[Employee, int64]{
	"employee",
}
