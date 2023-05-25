package logdb

// the interesting bits of this will mostly be ported to typescript
// Locks are just sites for now?
type StreamLock struct {
	Sid    int64
	Key    []byte // not used
	Length int64
}

// the write always succeeds
// the lock only succeeds if the length is correct
type StreamTx struct {
	Lock  []StreamLock
	Write []struct {
		Sid  int64
		Data []byte
	}
}
type StreamTxResult struct {
	Offset       []int64
	WriteSuccess bool
	LockSuccess  bool
}
type TableRange struct {
	Site          int64
	Table         string
	From, To      []byte
	Offset, Limit int64
}

// a list of cell lists. cells are signals
type SubscriptionState struct {
	Width  int64
	Height int64
	Update func(int64, int64, DocumentState)
	Get    func(int64, int64) DocumentState
}
type Subscription struct {
	State SubscriptionState
	TableRange
	Onchange func(SubscriptionState)
}

// character insertions are [n,n]+"C", and increase the length and position > n
// deletions don't change the length.
type IntervalNode struct {
	Left, Right *IntervalNode
	From        int64
	Height      int64
	To          []int64
	Op          []int64
	Args        []any
}
type PositionTransform struct {
}

// a rope

type IntervalTree struct {
	Root      *IntervalNode
	Transform *PositionTransform
}

// a document is a list of range formatting operations. The indices are monotonically increasing
// it can be gc'd at any global commit time. uncommitted changes can just stay as segments.
type DocumentState struct {
	a IntervalTree
}
type CellRef struct {
	Site  int64
	Table string
	Key   []byte
}
type DocumentSub struct {
	*CellRef
	Height float64
}
