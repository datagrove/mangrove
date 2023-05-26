package logdb

// mostly pass delta's around, because even if we use diff, serialization is going to defeat any attempt to short circuit the diff
// we store deltas in the page to make it easier to scrub through the values

type SparseRope struct {
}

type ConsensusValue struct {
	// interval tree of formatting ranges
	// deletion tree
	intervals IntervalTree[uint32]
	delete    Tree[uint32]
}

func (cv *ConsensusValue) ApplyDelta(d ConsensusValueDelta) {
	for _, op := range d {

	}
}

type Op struct {
	Begin int64
	End   int64
	Op    string
	Data  []byte
}
type ConsensusValueDelta = []Op
