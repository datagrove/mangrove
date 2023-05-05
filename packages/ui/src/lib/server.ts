// steps parameterized by 

import { Sequencer } from "./sequencer"

// accepts steps in order, or rejects them.
// Each committer can create a eqivalent snapshot stream
// use lock interface here?

export interface Nodex {
    keys: Uint8Array[]
    children?: Nodex[]
    leaf?: Uint8Array[]
}

// snapshot is a  counted btree.
export interface Snapshot {
    root: Nodex
    gsn: number
    lsn: number
}

// functor based?
export interface Tx {
    key: Uint8Array[]
    value: Uint8Array[]
    op: string[]
}

export interface Dbms {
    seq: { [key: string]: Sequencer }

    // locally we have a btree with partial images of multiple servers
    // we need normal 


    commit(tx: Tx): void
}