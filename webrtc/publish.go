package main

import (
	"context"

	"github.com/datagrove/mangrove/rpc"
)

func InitPublish(home string, m *rpc.ApiMap) error {

	// called by tail server
	m.AddRpc("publish", func(c context.Context, data []byte) (any, error) {

		return nil, nil
	})

	return nil
}
