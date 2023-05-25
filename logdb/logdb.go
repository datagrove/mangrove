package logdb

// maybe the server looks like a client and we configure it with tasks that we remotely ask it to do.
type DbModel interface {
	Commit([]*StreamTx, []*StreamTxResult) error
	Join(did string, server string) error
	Invite(user string, site string) error
	Leave(did string) error
	Subscribe(sub *Subscription) error
	Unsubscribe(sub *Subscription) error
	// on here could be a description of resources like Ray
	// one resource necessary is access to the necessary keys
	QueueTask(on string, cmd string, args []string) error
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
