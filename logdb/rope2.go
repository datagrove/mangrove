package logdb

import (
	"bytes"
	"io"
)

type Rope[T any] struct {
	root *RopeNode
}

type RopeLog struct {
	log Log
}

var (
	// SplitLength is the threshold above which slices will be split into
	// separate nodes.
	SplitLength = 4096 * 4
	// JoinLength is the threshold below which nodes will be merged into
	// slices.
	JoinLength = SplitLength / 2
	// RebalanceRatio is the threshold used to trigger a rebuild during a
	// rebalance operation.
	RebalanceRatio = 1.2
)

const (
	tLeaf = iota
	tNode
	tBlock // always weight 1, bytes are a pointer into the log.
)

// to use swizzling we need to go off heap because of go gc
type LogEntry struct {
	data []byte
	pos  int64
}

// A RopeNode in the rope structure. If the kind is tLeaf, only the value and
// length are valid, and if the kind is tNode, only length, left, right are
// valid.
type RopeNode struct {
	kind        byte
	value       []byte
	length      int
	left, right *RopeNode
}

// New returns a new rope node from the given byte slice. The underlying
// data is not copied so the user should ensure that it is okay to insert and
// delete from the input slice.
func New(b []byte) *RopeNode {
	n := &RopeNode{
		kind:   tLeaf,
		value:  b[0:len(b):len(b)],
		length: len(b),
	}
	n.adjust()
	return n
}

// Len returns the number of elements stored in the rope.
func (n *RopeNode) Len() int {
	return n.length
}

func (n *RopeNode) adjust() {
	switch n.kind {
	case tLeaf:
		if n.length > SplitLength {
			divide := n.length / 2
			n.left = New(n.value[:divide])
			n.right = New(n.value[divide:])
			n.value = nil
			n.kind = tNode
			n.length = n.left.length + n.right.length
		}
	case tNode:
		if n.length < JoinLength {
			n.value = n.Value()
			n.left = nil
			n.right = nil
			n.kind = tLeaf
			n.length = len(n.value)
		}
	}
}

// Value returns the elements of this node concatenated into a slice. May
// return the underyling slice without copying, so do not modify the returned
// slice.
func (n *RopeNode) Value() []byte {
	switch n.kind {
	case tLeaf:
		return n.value
	case tNode:
		return concat(n.left.Value(), n.right.Value())
	}
	panic("unreachable")
}

// Remove deletes the range [start:end) (exclusive bound) from the rope.
func (n *RopeNode) Remove(start, end int) {
	switch n.kind {
	case tLeaf:
		// slice tricks delete
		n.value = append(n.value[:start], n.value[end:]...)
		n.length = len(n.value)
	case tNode:
		leftLength := n.left.length
		leftStart := min(start, leftLength)
		leftEnd := min(end, leftLength)
		rightLength := n.right.length
		rightStart := max(0, min(start-leftLength, rightLength))
		rightEnd := max(0, min(end-leftLength, rightLength))
		if leftStart < leftLength {
			n.left.Remove(leftStart, leftEnd)
		}
		if rightEnd > 0 {
			n.right.Remove(rightStart, rightEnd)
		}
		n.length = n.left.length + n.right.length
	}
	n.adjust()
}

// Insert inserts the given value at pos.
func (n *RopeNode) Insert(pos int, value []byte) {
	switch n.kind {
	case tLeaf:
		// slice tricks insert
		n.value = insert(n.value, pos, value)
		n.length = len(n.value)
	case tNode:
		leftLength := n.left.length
		if pos < leftLength {
			n.left.Insert(pos, value)
		} else {
			n.right.Insert(pos-leftLength, value)
		}
		n.length = n.left.length + n.right.length
	}
	n.adjust()
}

// Slice returns the range of the rope from [start:end). The returned slice
// is not copied.
func (n *RopeNode) Slice(start, end int) []byte {
	if start >= end {
		return []byte{}
	}

	switch n.kind {
	case tLeaf:
		return n.value[start:end]
	case tNode:
		leftLength := n.left.length
		leftStart := min(start, leftLength)
		leftEnd := min(end, leftLength)
		rightLength := n.right.length
		rightStart := max(0, min(start-leftLength, rightLength))
		rightEnd := max(0, min(end-leftLength, rightLength))

		if leftStart != leftEnd {
			if rightStart != rightEnd {
				return concat(n.left.Slice(leftStart, leftEnd), n.right.Slice(rightStart, rightEnd))
			} else {
				return n.left.Slice(leftStart, leftEnd)
			}
		} else {
			if rightStart != rightEnd {
				return n.right.Slice(rightStart, rightEnd)
			} else {
				return []byte{}
			}
		}
	}
	panic("unreachable")
}

// At returns the element at the given position.
func (n *RopeNode) At(pos int) byte {
	s := n.Slice(pos, pos+1)
	return s[0]
}

// SplitAt splits the node at the given index and returns two new ropes
// corresponding to the left and right portions of the split.
func (n *RopeNode) SplitAt(i int) (*RopeNode, *RopeNode) {
	switch n.kind {
	case tLeaf:
		return New(n.value[:i]), New(n.value[i:])
	case tNode:
		m := n.left.length
		if i == m {
			return n.left, n.right
		} else if i < m {
			l, r := n.left.SplitAt(i)
			return l, join(r, n.right)
		}
		l, r := n.right.SplitAt(i - m)
		return join(n.left, l), r
	}
	panic("unreachable")
}

func join(l, r *RopeNode) *RopeNode {
	n := &RopeNode{
		left:   l,
		right:  r,
		length: l.length + r.length,
		kind:   tNode,
	}
	n.adjust()
	return n
}

// Join merges all the given ropes together into one rope.
func Join(a, b *RopeNode, more ...*RopeNode) *RopeNode {
	s := join(a, b)
	for _, n := range more {
		s = join(s, n)
	}
	return s
}

// Rebuild rebuilds the entire rope structure, resulting in a balanced tree.
func (n *RopeNode) Rebuild() {
	switch n.kind {
	case tNode:
		n.value = concat(n.left.Value(), n.right.Value())
		n.left = nil
		n.right = nil
		n.adjust()
	}
}

// Rebalance finds unbalanced nodes and rebuilds them.
func (n *RopeNode) Rebalance() {
	switch n.kind {
	case tNode:
		lratio := float64(n.left.length) / float64(n.right.length)
		rratio := float64(n.right.length) / float64(n.left.length)
		if lratio > RebalanceRatio || rratio > RebalanceRatio {
			n.Rebuild()
		} else {
			n.left.Rebalance()
			n.right.Rebalance()
		}
	}
}

// Each applies the given function to every node in the rope.
func (n *RopeNode) Each(fn func(n *RopeNode)) {
	fn(n)
	if n.kind == tNode {
		n.left.Each(fn)
		n.right.Each(fn)
	}
}

// EachLeaf applies the given function to every leaf node in order.
func (n *RopeNode) EachLeaf(fn func(n *RopeNode) bool) bool {
	switch n.kind {
	case tLeaf:
		return fn(n)
	default: // case tNode
		if n.left.EachLeaf(fn) {
			return true
		}
		return n.right.EachLeaf(fn)
	}
}

// Count the number of occurrences of 'sep' in this rope in the range
// [start:end).
func (n *RopeNode) Count(start, end int, sep []byte) int {
	_, r := n.SplitAt(start)
	l, _ := r.SplitAt(end - start)

	var count int
	l.EachLeaf(func(n *RopeNode) bool {
		count += bytes.Count(n.Value(), sep)
		return false
	})
	return count
}

// IndexAllFunc iterates through all occurrences of 'sep' in the range
// [start:end) and calls fn each time with the index of the occurrence. If 'fn'
// returns 'true' iteration is aborted and fn will no longer be called.
func (n *RopeNode) IndexAllFunc(start, end int, sep []byte, fn func(idx int) bool) {
	_, r := n.SplitAt(start)
	l, _ := r.SplitAt(end - start)

	var total int
	l.EachLeaf(func(it *RopeNode) bool {
		val := it.Value()
		var acc int
		for {
			idx := bytes.Index(val[acc:], sep)
			if idx == -1 {
				acc += len(val[acc:])
				break
			}

			if fn(start + total + acc + idx) {
				return true
			}

			acc += idx + 1
		}
		total += acc
		return false
	})
}

// ReadAt implements the io.ReaderAt interface.
func (n *RopeNode) ReadAt(p []byte, off int64) (nread int, err error) {
	if off > int64(n.length) {
		return 0, io.EOF
	}

	end := off + int64(len(p))
	if end >= int64(n.length) {
		end = int64(n.length)
		err = io.EOF
	}
	b := n.Slice(int(off), int(end))
	nread = copy(p, b)
	return nread, err
}

// WriteTo implements the io.WriterTo interface.
func (n *RopeNode) WriteTo(w io.Writer) (int64, error) {
	var err error
	var ntotal int64
	n.EachLeaf(func(it *RopeNode) bool {
		var nwritten int
		nwritten, err = w.Write(it.Value())
		ntotal += int64(nwritten)
		return err != nil
	})
	return ntotal, err
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// from slice tricks
func insert(s []byte, k int, vs []byte) []byte {
	if n := len(s) + len(vs); n <= cap(s) {
		s2 := s[:n]
		copy(s2[k+len(vs):], s[k:])
		copy(s2[k:], vs)
		return s2
	}
	s2 := make([]byte, len(s)+len(vs))
	copy(s2, s[:k])
	copy(s2[k:], vs)
	copy(s2[k+len(vs):], s[k:])
	return s2
}

func concat(a, b []byte) []byte {
	c := make([]byte, 0, len(a)+len(b))
	c = append(c, a...)
	c = append(c, b...)
	return c
}
