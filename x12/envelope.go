package x12

type EdiOptions struct {
	Sender     KeyValue
	Receiver   KeyValue
	Gs02       string
	Gs03       string
	Sdelim     string
	Edelim     string
	Cdelim     string
	Rdelim     string
	Production string
}

const (
	CCYYMMDD = "20060102"
	HHMM     = "1504"
)

func NewEdiOptions(send, receiver string) *EdiOptions {
	sendx := KeyValue{
		Key:   send[0:2],
		Value: send[2:],
	}
	receiverx := KeyValue{
		Key:   receiver[0:2],
		Value: receiver[2:],
	}
	r := &EdiOptions{
		Sender:     sendx,
		Receiver:   receiverx,
		Gs03:       receiverx.Value,
		Gs02:       sendx.Value,
		Sdelim:     "~",
		Edelim:     "*",
		Cdelim:     ":",
		Rdelim:     "^",
		Production: "P",
	}

	return r
}
