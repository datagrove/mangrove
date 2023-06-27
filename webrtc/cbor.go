package main

import "github.com/fxamacker/cbor/v2"

type Partial = map[string]any

// an strange way to update structures from partial cbor types
func mergeStruct[T any](f *T, upd Partial) {
	b, _ := cbor.Marshal(f)
	var asKeys = map[string]any{}
	cbor.Unmarshal(b, &asKeys)
	for k, v := range upd {
		asKeys[k] = v
	}
	b, _ = cbor.Marshal(asKeys)
	cbor.Unmarshal(b, f)
}
