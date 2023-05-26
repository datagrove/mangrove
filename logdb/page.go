package logdb

// each page has 256K
// each tuple has slots; you can reference both with a single 64 bit pointer
// each 16 bit slot points to the head of the tree representing the tuple
// the first level of the tree is the column integer; this has one bit to indicate a consensus value vs a local proposal
// pages can overflow when evicted

// in addition to slots, the page may hold a variable number of child lists.
// child lists are accessed by a path of positions from the root

// nodes can be
// element: may have children, no text
// text: always a leaf
// decorator: always a leaf
// linebreaknode: always a leaf


type ApplyFn func(p TupleRope, r *ScanResult, offset int) 

type ScanOptions struct {
	Format int  // html? json? cbor? unpacked?
	Limit int   // Do we count the limit as folded?
	Depth int
}
func StandardScan(opt *ScanOptions) ApplyFn {
	return func(p TupleRope, r *ScanResult, offset int) {
		//  the standard thing we want is to take the entire cell and return the 

	}
}

// these keys should allow swizzled keys but we need the btree to support that.
type ScanOp struct {
	Consensus bool
	Columns []int   // the column indicates if we want the consensus value or the local value
	Keys    []uint64
	Apply []ApplyFn // one per column
	// we don't need offset, just adjust the keys slice, probably in ts though?
}
type ScanResult struct {
	Value []byte  // dense, should we support 
	Error error
}

func Scan(b *BufferPool, s ScanOp,r* ScanResult ){

	for i,k := range s.Keys {
		for c := range s.Columns {
			var x TupleRope
			_ = k
			s.Apply[c](x,r,i)
		}
	}
}
func Update(b *BufferPool, UpdateOp, )


type BufferPool struct {
	page []Frame
}

type Frame struct {
	bytes []byte
	// this int64 includes the slot being modified and the column being modified
	updates map[int64]*TupleRope
}

func (f *Frame) GetText() {

}

// lives in the heap until eviction.
type TupleRope struct {
}
