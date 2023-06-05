




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

// to renumber an interval tree we need to search for the left 

// crdt blobs are collaborations on a single attributed string.
// we have special functors to apply these to a cell

// we could use a contextDevice here, but do we need to have consensus when disconnected (campfire mode)?
// is should be cheaper to transform without?
export interface CrdtEntry {
    c: number
    // transaction ?
    i: [number,string][] // keep or 
    t: [string, number, number, any ][]
}
type CrdtTuple = {
    [key: string]: CrdtEntry
}

// maybe return tuple and overflow? how does this impact the indexing
// indexing could be in a separate worker, separate database. this separate worker could also rewrite snapshots to make them open faster. 1) write a new snapshot, 2) ask the database thread to rebase to it. 3) delete the old snapshot.
// we could crawl the log to build to send the indexing worker
// can it always use 64 bit id to relate?
// maybe the client should manage? this has nothing to do with the cloud.
function  applyCrdt( tuple: any, tp: CrdtTuple) {

}

// these are only sent peer to peer best effort
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
