package server

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/datagrove/mangrove/store"
	"github.com/fxamacker/cbor/v2"
	"github.com/joho/godotenv"
)

func countPath(path string) int16 {
	return int16(len(strings.Split(path, "/")))
}

// we should generate a putobject and let the browser upload the file.
func fileApi(mg *Server) {
	// cl, e := store.NewS3Client()
	// if e != nil {
	// 	log.Fatal(e)
	// }
	// _ = cl
	godotenv.Load()

	// we can change this to other kinds of stores.
	var df store.Fsi = &store.Osfs{
		Root: mg.Root,
	}
	mg.AddApij("getLive", true, func(a *Rpcpj) (any, error) {
		var v struct {
			did  string
			name string
			path string
		}
		json.Unmarshal(a.Params, &v)
		return "https://datagrove.com", nil
	})
	mg.AddApi("write", true, func(a *Rpcp) (any, error) {
		var v struct {
			Sid  int64  `json:"sid,omitempty"` // we have to make sure they can write this
			Path string `json:"path,omitempty"`
			Mime string `json:"mime,omitempty"`
			Data []byte `json:"data,omitempty"`
		}
		cbor.Unmarshal(a.Params, &v)
		if !mg.Can(a.Session, v.Sid, 2) {
			return nil, fmt.Errorf("no permission")
		}
		return nil, df.Write(v.Sid, v.Path, v.Data)

		//return cl.PresignPutObject(filePath)
		//return nil, cl.Upload(filePath, v.Mime, v.Data)
	})
	mg.AddApi("ls", true, func(a *Rpcp) (any, error) {
		var v struct {
			Sid int64 `json:"sid,omitempty"` // we have to make sure they can
		}
		cbor.Unmarshal(a.Params, &v)
		if !mg.Can(a.Session, v.Sid, 2) {
			return nil, fmt.Errorf("no permission")
		}
		return df.Ls(v.Sid)
	})

	// should probably be a redirect to r2?
	mg.AddApi("read", true, func(a *Rpcp) (any, error) {
		var v struct {
			Sid  int64  `json:"sid,omitempty"` // we have to make sure they can
			Path string `json:"path,omitempty"`
		}
		cbor.Unmarshal(a.Params, &v)
		if !mg.Can(a.Session, v.Sid, 2) {
			return nil, fmt.Errorf("no permission")
		}
		return df.Read(v.Sid, v.Path)
	})
	mg.AddApi("rm", true, func(a *Rpcp) (any, error) {
		var v struct {
			Sid  int64  `json:"sid,omitempty"` // we have to make sure they can
			Path string `json:"path,omitempty"`
		}
		cbor.Unmarshal(a.Params, &v)
		if !mg.Can(a.Session, v.Sid, 2) {
			return nil, fmt.Errorf("no permission")
		}
		return nil, df.Delete(v.Sid, v.Path)

	})
	// read we can do directly from r2
}
