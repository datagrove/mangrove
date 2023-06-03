

// a crdt that matches up with our database capabilities
// we are interested in ordered things that don't naturally fit in sql

// we don't 

// most things are operations on a monotonically growing interval tree
// the 

// we have a sparse vector for the active text
// we need to remember there was a deletion, but not the text itself
interface SparseVector {

}

// interleaving streams of edits. each user notes in their own stream when they see an edit from another user
// we can optimize this a little by letting a mark for the global stream represent a batch of edits

// each cell has a designated host, each host numbers the devices. use that number here.
type DeviceId = number
interface CellStream {

}
interface CellText {

}


