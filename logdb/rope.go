package logdb

import (
	"fmt"
	"strings"
)

type Rope struct {
	left   *Rope
	right  *Rope
	weight int
	value  string
}

func NewRope(value string) *Rope {
	return &Rope{
		left:   nil,
		right:  nil,
		weight: len(value),
		value:  value,
	}
}

func (r *Rope) Length() int {
	if r == nil {
		return 0
	}
	return r.weight
}

func (r *Rope) Index(index int) (byte, error) {
	if index < 0 || index >= r.Length() {
		return 0, fmt.Errorf("index out of range")
	}

	if r.left != nil {
		leftLength := r.left.Length()
		if index < leftLength {
			return r.left.Index(index)
		}
		return r.right.Index(index - leftLength)
	}

	return r.value[index], nil
}

func (r *Rope) Concatenate(other *Rope) *Rope {
	if r == nil {
		return other
	}
	if other == nil {
		return r
	}

	newWeight := r.Length() + other.Length()
	if newWeight <= 4 {
		return NewRope(r.String() + other.String())
	}

	if r.Length() >= other.Length() {
		r.right = r.right.Concatenate(other)
		r.weight = r.Length() + other.Length()
		return r
	}

	if other.left == nil {
		r.right = other
		r.weight = newWeight
		return r
	}

	r.right = r.right.Concatenate(other.left)
	other.left = nil
	r.weight = newWeight
	return r
}

func (r *Rope) Substring(start, end int) (*Rope, error) {
	if start < 0 || end > r.Length() || start > end {
		return nil, fmt.Errorf("substring indices out of range")
	}

	if r.left != nil {
		leftLength := r.left.Length()
		if end <= leftLength {
			return r.left.Substring(start, end)
		} else if start >= leftLength {
			return r.right.Substring(start-leftLength, end-leftLength)
		} else {
			leftSubstring, _ := r.left.Substring(start, leftLength)
			rightSubstring, _ := r.right.Substring(0, end-leftLength)
			return leftSubstring.Concatenate(rightSubstring), nil
		}
	}

	return NewRope(r.value[start:end]), nil
}

func (r *Rope) String() string {
	if r == nil {
		return ""
	}

	var sb strings.Builder
	r.writeToStringBuilder(&sb)
	return sb.String()
}

func (r *Rope) writeToStringBuilder(sb *strings.Builder) {
	if r.left != nil {
		r.left.writeToStringBuilder(sb)
		r.right.writeToStringBuilder(sb)
	} else {
		sb.WriteString(r.value)
	}
}
