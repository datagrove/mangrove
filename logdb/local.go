package logdb

import (
	"github.com/fxamacker/cbor/v2"
)

// the go version of the server can be used with native apps
// this allows multiple clients to share the same consensus state.

// this interface needs to add the device id by the time its processed by the server
// the data on the server is encrypted, not necessarily so here.

// can we be a server of record for some things and a client for others?
// not clear that combining these is a good idea.

type ProposeLock struct {
	Server string
	Did    string
	Lock   []byte
}

// we need to allow a custom merge function that is used to close orphans

// don't delete formats; overwrite the format the way you want
const (
	OpInsert = iota // only thing that changes positions, and only increases them
	OpDelete        // not exactly a delete, more of a format as hidden. positions don't change.
	OpFormat
)

// roughly a map of proposed values
// each values is an interval tree of formatting ranges
type ConsensusValueUpdate struct {
	Begin int64
	End   int64
	Op    int
	Data  []byte
}

// a functor updates a cell, so this can be OT?
type Functor struct {
	TableHandle int
	UpdateKey   []byte
	UpdateValue ConsensusValueUpdate
	Op          string
}
type Tx struct {
	Session string
	Functor []Functor
}
type Proposal struct {
}
type TableHandle interface{}

// url is server/did
// credentials are needed to

// joining, leaving, connect, disconnect are all transactions on the local store. tasks do the work. listen for the results.
// Join(server, did ,cred Credential) error
// Leave(did string) error
// invitations require an introduction; server is aware, but maybe better than email introduction? return string that can be used in email though.
// Grant(user string, site string, cap Caps) error
// Revoke(user string, site string, cap Caps) error
// alternate solution here is to use prepare? how troublesome is that?
// isn't prepare just a insert itself? but potentially we can use
// Open(Session, table string) (TableHandle, error)
// Close(TableHandle)

// // can return error if timeout, while operation succeeds.
// Commit(tx Tx) error
// // note that this can fail without error (due to consensus conflict)
// Propose(tx Proposal) (bool, error)
// client stores encypt and decrypt data
// server stores only handle encrypted data.
type CustomFunction func(method string, tx Tx, data []byte) error

type Session interface{}

type Statement interface{}

type Package struct{}

type Result interface {
}

// we need delta's instead of states to communicate changes efficiently
type Delta interface {
}

type RangeSpec struct {
	Server string
	Site   string
	Table  string
	Begin  []byte
	End    []byte
	Offset int64
	Limit  int64
}
type Range struct {
}

// Delta's should be mergeable so if the socket gets behind.
type OnChange func(rg []*Range)

// even locally we need consensus, so our commit streams must identify the sessions they are on. We can't know that a session will ever come back, so to not lose edits we need to complete orphaned sessions ourselves.
type Database interface {
	// indicate the packages that you need, then supply all the ones that
	// it can't supply. It can check trusted registries like fuschia

	// wrapped by messagechannel providers.
	Connect(packageSpec ...[]string) (Session, map[string]bool, error)
	UpgradePackage(Session, packageSpec string, pack Package) error
	Execute(Session, method string, params cbor.RawMessage) (cbor.RawMessage, []error)
	ListenRange(r []*RangeSpec) (Listener, error)
	RemoveListener(Listener) error

	// Call when session is deemed broken. (maybe wait some time for reconnection?)
	Disconnect(Session) error
	// one function that will get called for udf's.
}

// we can listen to the online as a range on a vtable
type SessionImpl struct {
}
type LocalStoreSimple struct {
	store       FileStore
	f           File
	remote      map[string]MessageChannel
	root        int // 0 or 1, alternates on each group commit
	nextSession int
	session     map[int]*SessionImpl
}

func (ls *LocalStoreSimple) NewClient(mc MessageChannel) error {
	return nil
}

func (ls *LocalStoreSimple) serveRpc(data []byte) ([]byte, error) {
	var v struct {
		Method string
		Params cbor.RawMessage
	}
	e := cbor.Unmarshal(data, &v)
	if e != nil {
		return nil, e
	}
	switch v.Method {
	case "connect":

	case "commit":
		var tx Tx
		e := cbor.Unmarshal(v.Params, &tx)
		if e != nil {
			return nil, e
		}
		e = ls.Commit(tx)
	}
	return nil, e
}

// Close implements ClientStore
func (ls *LocalStoreSimple) Close(TableHandle) error {
	ls.f.Close()
	ls.store.Close()
	return nil
}

// Commit implements ClientStore
func (*LocalStoreSimple) Commit(tx Tx) error {
	return nil
}

// Connect implements ClientStore
func (*LocalStoreSimple) Connect() Session {
	return &SessionImpl{}
}

// Disconnect implements ClientStore
func (*LocalStoreSimple) Disconnect(Session) error {
	panic("unimplemented")
}

// Open implements ClientStore
func (*LocalStoreSimple) Open(Session string, table string) (TableHandle, error) {
	panic("unimplemented")
}

// Propose implements ClientStore
func (*LocalStoreSimple) Propose(tx Proposal) (bool, error) {
	panic("unimplemented")
}

// RemoveListener implements ClientStore
func (*LocalStoreSimple) RemoveListener(Listener) error {
	panic("unimplemented")
}

func NewLocalStoreSimple(store FileStore, fn CustomFunction) (*LocalStoreSimple, error) {
	f, e := store.Create("log")
	if e != nil {
		return nil, e
	}

	r := &LocalStoreSimple{
		store: store,
		f:     f,
	}
	// recover our state from the store, or generate a new one
	// connect to our servers and synchronize
	if f.Length() == 0 {
		// the first two pages are alternate roots
		var page = make([]byte, 4096)
		f.WriteAt(page, 0)
		f.WriteAt(page, 4096)
		// make some initial transactions.

	}

	return r, nil
}

//Listen(event func(server string, bytes []byte)) (Listener, error)
// create an account, we may share clear data with the server like email
// invitations are created as tuples in this shared database specifying the challenge that the invitation requires
// returns an id for the shared database
//Connect(server string, credential Credential) error

// write a wrapper that listens to websocket and calls the rpc
