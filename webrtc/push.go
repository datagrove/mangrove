package main

type TxPush struct {
	FileId            // put in header so we can route without finishing the parsing.
	Rowid  int64      // needed for a link to the original write
	Data   []byte     // not necessarily the tuple, probably a summary.
	PushTo []DeviceId // @joe, @jane, @bob, doesn't need to be replicated.
}
