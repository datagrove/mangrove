package logdb

type Caps = int
type Handle struct {
	Site int64
	Id   int64
}

type Lstx struct {
}

// a transaction that attempts to note particular device logs as canon
type Lstag struct {
}

// remote interface: sees things as sites and locks

// takes a server

type Credential interface {
}

type Listener interface{}

// note that queueing a task is inserting a tuple in shared db

// things we can do with encrypted bits
type Log interface {
	Write(handle Handle, device int64, data []byte) (int64, error)
	Read(handle Handle, device int64, data []byte) (int64, error)
	Trim(handle Handle, device int64, pos int64) error

	Commit(handle Handle, device int64) error
}

// maybe the server looks like a client and we configure it with tasks that we remotely ask it to do.
type DbModel interface {
}
type LocalModel interface {
	Write(data []byte) (int64, error)
	Read(offset int64, length int64) ([]byte, error)
	Trim(offset int64) error
}

// what is my sync/flush model?
type RemoteModel interface {
	Write(data []byte) (int64, error)
	Read(offset int64, length int64) ([]byte, error)
	Trim(offset int64) error
}

// A Db has to manage both a local store and a remote log
type Db struct {
	remote RemoteModel
	local  LocalModel
}

// Commit implements DbModel
func (*Db) Commit(tx []*StreamTx, result []*StreamTxResult) error {
	return nil
}

// Invite implements DbModel
func (*Db) Invite(user string, site string) error {
	panic("unimplemented")
}

// Join implements DbModel
func (*Db) Join(did string, server string) error {
	panic("unimplemented")
}

// Leave implements DbModel
func (*Db) Leave(did string) error {
	panic("unimplemented")
}

// QueueTask implements DbModel
func (*Db) QueueTask(on string, cmd string, args []string) error {
	panic("unimplemented")
}

// Subscribe implements DbModel
func (*Db) Subscribe(sub *Subscription) error {
	panic("unimplemented")
}

// Unsubscribe implements DbModel
func (*Db) Unsubscribe(sub *Subscription) error {
	panic("unimplemented")
}

func NewDb(model LocalModel, log RemoteModel) (*Db, error) {
	return &Db{
		remote: model,
		local:  model,
	}, nil
}

var _ DbModel = (*Db)(nil)
