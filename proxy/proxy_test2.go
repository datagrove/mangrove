package main

import "os"

func Test_start() {
	os.Args = []string{"proxy", "start"}
	main()
}
