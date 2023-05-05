
// shared by worker and client
// counted btree


// is it one tree or many?

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

// functor based? each cell is a log of op/value
export interface Tx {
    lock: { [key: string]: number }  // locks must advance by 1 or tx fails
    key: Uint8Array[]
    value: Uint8Array[]
    op: string[]
}


export interface Tx {
    lock: { [key: string]: number }  // locks must advance by 1 or tx fails
    key: Uint8Array[]
    value: Uint8Array[]
}