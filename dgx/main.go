package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

// in addition to the cluster we want to start an embedded web server that is the editor.
// the editor should have access to other clusters as well as its home cluster

func StartPeer(home string, i int, outof int, core int) {

	host := make([]string, outof)
	for i := 0; i < len(host); i++ {
		host = append(host, fmt.Sprintf(":809%d", i))
	}

	cfg := &ClusterConfig{
		Me:           0,
		Peer:         []string{},
		Shard:        make([]Shard, core),
		Ws:           "",
		WsStart:      9000,
		PortPerShard: 0,
	}
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

// build a cluster
func main() {
	// Create a cluster with 1 node, or join an existing cluster

	var rootCmd = &cobra.Command{
		Use:   "dgx",
		Short: "dgx - clustered e2e datastore",
		Long: `dgx starts a cluster of 1, then you add more nodes.
		When restarting a cluster, you need enough nodes of the original cluster to recover the state. Any node of the cluster can be used as the start.`,
	}
	var start = &cobra.Command{
		Use:   "join",
		Short: "join cluster",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			cfg := &ClusterConfig{
				Me:           0,
				Peer:         []string{},
				ShardStart:   0,
				Ws:           "",
				WsStart:      0,
				PortPerShard: 0,
				Shard:        []Shard{},
			}
			a, e := NewCluster(cfg)
			if e != nil {
				panic(e)
			}
			a.Run()
		},
	}
	var join = &cobra.Command{
		Use:   "join",
		Short: "join cluster",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {

		},
	}
	rootCmd.AddCommand(join, start)

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "  There was an error while executing your CLI '%s'", err)
		os.Exit(1)
	}
}
