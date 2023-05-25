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
		rg.Wait()
		spew.Dump(rg)
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
