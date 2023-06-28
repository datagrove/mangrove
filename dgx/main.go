package main

import (
	"fmt"
	"os"
	"path"
	"runtime"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// in addition to the cluster we want to start an embedded web server that is the editor.
// the editor should have access to other clusters as well as its home cluster

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
		Use:   "start",
		Short: "start cluster",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			home := "."
			if len(args) > 0 {
				home = args[0]
			}
			cfg := &ClusterConfig{
				Me:           0,
				ShardStart:   0,
				Ws:           "localhost",
				WsStart:      9000,
				PortPerShard: 1,
				cores:        runtime.NumCPU(),
			}
			viper.SetConfigName(path.Join(home, "dgx")) // name of config file (without extension)
			err := viper.ReadInConfig()                 // Find and read the config file
			if err != nil {                             // Handle errors reading the config file
				// create a default config
			}
			config := func() {
				if err := viper.Unmarshal(cfg); err != nil {
					panic(err)
				}

			}
			viper.OnConfigChange(func(e fsnotify.Event) {
				config()
			})
			viper.WatchConfig()
			config()
			// we can watch the configuration directory and restart if it changes, but for a cluster that's going to hurt
			// what does it mean if this changes in a cluster? does everyone change? viper will read from etcd, consul etc, so that's interesting
			// read the home director to see if this is a restart

			st, e := NewState(home, cfg)
			if e != nil {
				panic(e)
			}
			st.Run()
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
