

// a crdt that matches up with our database capabilities
// we are interested in ordered things that don't naturally fit in sql

// we don't 

// most things are operations on a monotonically growing interval tree
// the 
interface IntervalTree {

}
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

// these are just thrown away and not preserved in the document
// including cursor and maybe selection
interface CellPresence {
    device: DeviceId
    format: {
        start: number
        end: number
        type: string
        desc: Uint8Array
    }[]
}

interface CellDiff {
    device: DeviceId
    contextDevice:  number
    contextLength: number
    at: number[] // keep or 
    insert: string[]
    format: {
        type: string
        start: number
        end: number
        desc: Uint8Array
    }[]
}
