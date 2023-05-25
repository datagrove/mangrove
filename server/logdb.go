package server

import "github.com/datagrove/mangrove/logdb"

// Connect(packageSpec ...[]string) (Session, map[string]bool, error)
// UpgradePackage(Session, packageSpec string, pack Package) error
// Execute(Session, method string, params cbor.RawMessage) (cbor.RawMessage, []error)
// ListenRange(r []*RangeSpec) (Listener, error)
// RemoveListener(Listener) error

// when a session is established
func (s *Server) LogdbApi() {

	// Should we wait for a commit here and block the goroutine?
	// potentially we should handle this ourselves.
	s.AddApi("commit", true, func(r *Rpcp) (any, error) {
		var v logdb.Tx
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return nil, s.Commit(r.Session, &v)
	})

}
