package logdb

import (
	"bytes"
	"math/rand"
	"os"
	"testing"
)

func check(r *RopeNode, b *basicText, t *testing.T) {
	if !bytes.Equal(r.Value(), b.value()) {
		t.Errorf("incorrect bytes: %s %s", string(r.Value()), string(b.value()))
	}
	if r.Len() != b.length() {
		t.Errorf("incorrect length: %d %d", r.Len(), b.length())
	}
}

const datasz = 5000

func data() (*RopeNode, *basicText) {
	data := randbytes(datasz)
	r := New(data)
	b := newBasicText(data)
	return r, b
}

func randrange(high int) (int, int) {
	i1 := rand.Intn(high)
	i2 := rand.Intn(high)
	return min(i1, i2), max(i1, i2)
}

var letters = []byte("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randbytes(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return b
}

func TestMain(m *testing.M) {
	SplitLength = 4
	JoinLength = 2

	os.Exit(m.Run())
}

func TestConstruction(t *testing.T) {
	r, b := data()
	check(r, b, t)
}

func TestInsertRemove(t *testing.T) {
	r, b := data()

	const nedit = 100
	const strlen = 20
	for i := 0; i < nedit; i++ {
		low, high := randrange(r.Len())
		r.Remove(low, high)
		b.remove(low, high)
		check(r, b, t)
		bstr := randbytes(strlen)
		r.Insert(low, bstr)
		b.insert(low, bstr)
		check(r, b, t)
	}
	check(r, b, t)
}

func TestSlice(t *testing.T) {
	r, b := data()

	const nslice = 100
	length := r.Len()
	for i := 0; i < nslice; i++ {
		low, high := randrange(length)

		rb := r.Slice(low, high)
		bb := b.slice(low, high)
		if !bytes.Equal(rb, bb) {
			t.Errorf("slice not equal: %s %s", string(rb), string(bb))
		}
	}
}

func TestSplit(t *testing.T) {
	r, b := data()

	const nsplit = 10
	for i := 0; i < nsplit; i++ {
		splitidx := rand.Intn(r.Len())
		left, right := r.SplitAt(splitidx)

		lb := b.slice(0, splitidx)
		rb := b.slice(splitidx, b.length())
		if !bytes.Equal(left.Value(), lb) {
			t.Errorf("%d: left slice not equal: %s %s", splitidx, string(left.Value()), string(lb))
		}
		if !bytes.Equal(right.Value(), rb) {
			t.Errorf("%d: right slice not equal: %s %s", splitidx, string(right.Value()), string(rb))
		}
		r = Join(left, right)
		check(r, b, t)
	}
}

type basicText struct {
	data []byte
}

func newBasicText(b []byte) *basicText {
	data := make([]byte, len(b))
	copy(data, b)
	return &basicText{
		data: data,
	}
}

func (b *basicText) length() int {
	return len(b.data)
}

func (b *basicText) value() []byte {
	return b.data
}

func (b *basicText) remove(start, end int) {
	b.data = append(b.data[:start], b.data[end:]...)
}

func (b *basicText) insert(pos int, val []byte) {
	b.data = insert(b.data, pos, val)
}

func (b *basicText) slice(start, end int) []byte {
	return b.data[start:end]
}
