package x12

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"
)

type EdiStream struct {
	*EdiOptions
	s        strings.Builder
	segCount int
}

func (e *EdiStream) WriteToFile(path string) {
	os.WriteFile(path, []byte(e.s.String()), os.ModePerm)
	e.s.Reset()
}

type EdiWriter struct {
	EdiStream
	controlNumber string
	path          string
	ccyymmdd      string
	hhmm          string
	GroupCount    int
	stCount       int
}

func NewEdiWriter(op *EdiOptions, path string, controlNumber int) (*EdiWriter, error) {
	tm := time.Now()
	ccyymmdd := tm.Format(CCYYMMDD)
	hhmm := tm.Format(HHMM)
	r := &EdiWriter{
		EdiStream: EdiStream{
			EdiOptions: op,
		},
		path:          path,
		ccyymmdd:      ccyymmdd,
		hhmm:          hhmm,
		GroupCount:    0,
		controlNumber: fmt.Sprintf("%09d", controlNumber),
	}
	x := op
	v := []string{"ISA", "00", Pad("", 10), "00", Pad("", 10),
		x.Sender.Key, Pad(x.Sender.Value, 15),
		x.Receiver.Key, Pad(x.Receiver.Value, 15),
		ccyymmdd[2:], hhmm, x.Rdelim, "00501", r.controlNumber, "0", "P", x.Cdelim}

	if len(v) == 0 {
		log.Fatalf("fatal %v", v)
	}
	for i, v := range v {
		if i > 0 {
			r.s.WriteString(op.Edelim)
		}
		r.s.WriteString(v)
	}
	r.s.WriteString(op.Sdelim) //+ "\r\n"
	return r, nil
}

func (w *EdiStream) fixString(s string) string {
	var o strings.Builder
	for _, c := range s {
		switch c {
		case '*':
		case '^':
		case ':':
		default:
			o.WriteRune(c)
		}

	}
	return strings.TrimSpace(o.String())
}

func (w *EdiStream) Write(r ...string) {
	for i := range r {
		r[i] = w.fixString(r[i])
	}
	w.segCount++
	for len(r) > 0 && len(r[len(r)-1]) == 0 {
		r = r[0 : len(r)-1]
	}
	for i, v := range r {
		if i > 0 {
			w.s.WriteString(w.Edelim)
		}
		w.s.WriteString(v)
	}
	w.s.WriteString(w.Sdelim) // + "\r\n"
}

func (w *EdiStream) Date(qual, ccyymmdd string) {
	if len(ccyymmdd) > 0 {
		w.Write("DTP", qual, "D8", ccyymmdd)
	}
}
func (w *EdiStream) Ref(qual, val string) {
	if len(val) > 0 {
		w.Write("REF", qual, val)
	}
}

func (w *EdiWriter) Close() {
	w.Write("IEA", fmt.Sprintf("%d", w.GroupCount), w.controlNumber)
	os.WriteFile(w.path, []byte(w.s.String()), 0666)
}

func (w *EdiWriter) BeginGroup(grouptype, editype string) {
	w.GroupCount++
	w.stCount = 0
	w.Write("GS", grouptype,
		w.EdiOptions.Gs02,
		w.EdiOptions.Gs03,
		w.ccyymmdd,
		w.hhmm,
		fmt.Sprintf("%d", w.GroupCount),
		"X", editype)
}
func (w *EdiWriter) EndGroup() {
	w.Write("GE", fmt.Sprintf("%d", w.stCount), fmt.Sprintf("%d", w.GroupCount))
}

func (w *EdiWriter) BeginTransaction(transactionSet string, standard string) {
	w.stCount++
	w.segCount = 0
	w.Write("ST",
		transactionSet,
		fmt.Sprintf("%09d", w.stCount),
		standard)
}
func (w *EdiWriter) EndTransaction() {
	w.segCount++
	w.Write("SE", fmt.Sprintf("%d", w.segCount), fmt.Sprintf("%09d", w.stCount))
}
