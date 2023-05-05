// steps parameterized by 

import { Sequencer } from "./sequencer"
import { encode,decode } from 'cbor-x'
import { SendToWorker } from "./socket"
// accepts steps in order, or rejects them.
// Each committer can create a eqivalent snapshot stream
// use lock interface here?

import MyWorker from './worker?worker'
import Shared from './shared?sharedworker'
import { Tx } from "../dbt/tree"

type DbTable<T,K> = {
    name: string
    encode: (t: T) => Uint8Array
    decode: (b: Uint8Array) => T
    encodeKey: (k: K) => Uint8Array
    decodeKey: (b: Uint8Array) => K
}


let shared: SendToWorker
async function init() {
     shared = await SendToWorker.shared(new Shared)
}
init()

// there is one dbms per worker. it wraps a connection to a shared worker.
export class Dbms {
    seq: { [key: string]: Sequencer } = {}

    // locally we have a btree with partial images of multiple servers
    // we need normal counted btree operations
    // cell based (allow columns)

    table = new Map<string, DbTable<any,any>>
    
    async commit(tx: Tx): Promise<void> {

    }
}

export interface Pos {

}
export interface Committer {
    screenName: string
    cursor: Pos[]
    selection: [Pos,Pos][]
}
type LWW = {
    value: string
    gsn: number
}


// each cell has a state we can listen to by creating an editor on it.
// there is a value type, a step type T, and a committer type Cl
// cl is mostly a cursor position, but could be a selection range.
export interface CellState<T=LWW, V=string, Cl=Committer> {
    value: V
    predicted: V
    proposals: T[]
    gsn: number
    lsn: number    // local edits s

    // committers specific values are part of the state; eg. we may share the location of the cursor.
    committer: { [key: number]: Cl }

    listeners: { [key: number]: (s: CellState) => void }

}

function cellUrl(db: Dbms, table: string, ): string {
    return ""
}


function toBytes(b: Buffer) {
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT)
}
// definition of a table needs to have a an codec? cbor is not sortable
const profile :  DbTable<Profile,ProfileKey> = { 
    name: "profile",
    encode: (p: Profile) => toBytes(encode(p)),
    decode: (b: Uint8Array) => decode(b),
    encodeKey: (k: ProfileKey) => toBytes(encode(k)),
    decodeKey: (b: Uint8Array) => decode(b)
}

// an index needs its own codec

export interface Editor<T,V,Cl> {
    el: HTMLInputElement
    cell: CellState<T, V, Cl>
}

// the cell state will exist in the shared worker
// editors will exist in the browser tabs. we need to be able to post transactions to the shared worker.

export function createCell<T,K,C=Committer>(db: Dbms, 
    table: DbTable<T,K>, 
    attr: (keyof T), key: K ) {

    const s = ""
    const r : CellState =  {
        value: s,
        predicted: s,
        proposals: [],
        gsn: 0,
        lsn: 0,
        committer: {},
        listeners: []
    }
    return r
}


// update needs to merge the editor with the dom: Data, Selection
// call when the step changes, call when 
// export const updateEditor = (e: Editor, tx: Tx) => {
// }
// declare module "solid-js" {
//     namespace JSX {
//         interface Directives {  // use:model
//             editor: StepValue;
//         }
//     }
// }







type refset = (el: HTMLInputElement) => void

// a dbstr needs to have enough informtion to update the database.
// it also needs to be able to populate a transaction in memory, 
export type dbstrDb = {
    table: DbTable<any,any>
    key: any
}

// db str needs to be a wrapper around a cellstate, the cell state may be on a remote server, an in-memory cell, or a local cell.
export type dbstr = {
    commit(tx: Tx): Promise<void>
    listen(cb: (v: string) => void): void
}
export function createEditor(d: dbstr) : [refset, Editor<LWW,string, Committer>] {
    const ed = { } as any
    return [(el: HTMLInputElement) => {}, ed]
}


/*
const createEditor2 = (key: StepValue, plugins?: Plugin[]) => {
    let el: HTMLInputElement | null = null
    // steps from listen are canonical
    key.listen((v) => {
        el!.value = v.
    })
    const onInput = (e: any) => {
        // steps from dom are proposals
        key.write([])
    }
    createEffect(() => {
        el!.addEventListener("oninput", onInput)
    })
    onCleanup(() => el!.removeEventListener("oninput", onInput));
    const ed: Editor = {
        el: el!,
        key: key,
        state: {}
    }
    return [edref, ed] as const

}
*/