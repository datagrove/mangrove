

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



// crdt blobs are collaborations on a single attributed string.
// we have special functors to apply these to a cell

// we could use a contextDevice here, but do we need to have consensus when disconnected (campfire mode). 
export interface CrdtEntry {

    contextGsn: number
    at: number[] // keep or 
    insert: string[]
    format: {
        type: string
        start: number
        end: number
        desc: Uint8Array
    }[]
}

// best effort? these are only sent peer to peer
// clients that can't do peer to peer don't get them.
// these are just thrown away and not preserved in the document
// including cursor and maybe selection
// the lobby can use an encrypted primary key to join on. what about a nonce?
export interface CellPresence {
    device: DeviceId
    name: string
    selection: {
        blockid: number  // gsn block was created?
        start: number
        end: number
        cursor: [number, number]
    }[]
}
