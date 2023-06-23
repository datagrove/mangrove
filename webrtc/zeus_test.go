package main

import "fmt"

func NewTestCluster() {
	host := make([]string, 3)
	for i := 0; i < len(host); i++ {
		host = append(host, fmt.Sprintf(":809%d", i))
	}

	cfg := &ClusterConfig{
		Me:           0,
		Peer:         []string{},
		Shard:        []Shard{},
		Ws:           "",
		WsStart:      9000,
		PortPerShard: 0,
	}
	for i := 0; i < len(host); i++ {
		st, e := NewState(fmt.Sprintf("test%d", i), 10)
		if e != nil {
			panic(e)
		}

		shard := make([]Shard, 10)
		for i := range shard {
			shard[i] = st.shard[i]
		}
		cfg.Me = i
		cfg.Shard = shard

		NewCluster(cfg)
	}

	// send some client messages
	for i := 0; i < 10; i++ {

	}
}
