package serde

import (
	"encoding/json"
	"os"
	"path"

	"github.com/tailscale/hujson"
)

// the idea here is to add a few different commands for standalone bespoke servers
//	should this return a cobra command?
// maybe there should be a default proxy server as well

func Unmarshal(b []byte, v interface{}) error {
	ast, err := hujson.Parse(b)
	if err != nil {
		return err
	}
	ast.Standardize()
	return json.Unmarshal(ast.Pack(), v)
}

func UnmarshalFile(v interface{}, p ...string) error {
	b, e := os.ReadFile(path.Join(p...))
	if e != nil {
		return e
	}
	return Unmarshal(b, v)

}
