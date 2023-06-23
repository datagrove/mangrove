package main

import "fmt"

func NewTestCluster() {
	host := make([]string, 3)
	for i := 0; i < len(host); i++ {
		host = append(host, fmt.Sprintf(":809%d", i))
	}

	for i := 0; i < len(host); i++ {
		st, e := NewState(fmt.Sprintf("test%d", i), 10)
		if e != nil {
			panic(e)
		}

		NewCluster(i, host, st.shards)
	}

	// send some client messages
}
