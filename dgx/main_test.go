package main

// the point of this is to make a cluster all in the same process to see if it helps us debug
func NewTestCluster() {
	for i := 0; i < 3; i++ {
		StartPeer("localhost", i, 3, 4)
	}

	// send some client messages
	for i := 0; i < 10; i++ {

	}
}
