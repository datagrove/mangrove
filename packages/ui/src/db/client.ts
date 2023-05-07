// steps parameterized by 

import { Sequencer } from "./sequencer"
import { encode, decode } from 'cbor-x'
import { SendToWorker } from "./socket"
// accepts steps in order, or rejects them.
// Each committer can create a eqivalent snapshot stream
// use lock interface here?

import MyWorker from './worker?worker'
import Shared from './shared?sharedworker'
import { Tx } from "../dbt/tree"
import { Watch, toBytes } from "./data"
import { z } from "zod"
import { l } from "../i18n/en"
import { JSXElement, createSignal } from "solid-js"

class Client {
    shared: SendToWorker | undefined

    makeRpc<P, R>(method: string) {
        return async (x: P) => await this.shared?.rpc<R>(method, x)
    }
}
const cl = new Client()
async function init() {
    cl.shared = await SendToWorker.shared(new Shared)
}
init()

export const watch = cl.makeRpc<Watch, number>('watch')
export const update = cl.makeRpc<Tx, void>('updateTx')
export const read = cl.makeRpc<Tx, Uint8Array[]>('readTx')
export const commit = cl.makeRpc<number, void>('commitTx')
export const unwatch = cl.makeRpc<number, void>('unwatch')


export type DbTable<T, K> = {
    name: string
    encode: (t: T) => Uint8Array
    decode: (b: Uint8Array) => T
    encodeKey: (k: K) => Uint8Array
    decodeKey: (b: Uint8Array) => K
}



// there is one dbms per worker. it wraps a connection to a shared worker.
export class Dbms {
    table = new Map<string, DbTable<any, any>>

    // locally we have a btree with partial images of multiple servers
    // we need normal counted btree operations
    // cell based (allow columns)

}
export const dbms = new Dbms()


type Pos = number

// prefer to not log these
export interface Committer {
    screenName: string
    cursor: Pos[]
    selection: [Pos, Pos][]
}
type LWW = {
    value: string
    gsn: number
}


// each cell has a state we can listen to by creating an editor on it.
// there is a value type, a step type T, and a committer type Cl
// cl is mostly a cursor position, but could be a selection range.
export interface CellState<T = LWW, V = string, Cl = Committer> {
    value: V
    predicted: V
    proposals: T[]
    gsn: number
    lsn: number    // local edits s

    // committers specific values are part of the state; eg. we may share the location of the cursor.
    committer: { [key: number]: Cl }
    listeners: { [key: number]: (s: CellState) => void }
}


// definition of a table needs to have a an codec? cbor is not sortable

// an index needs its own codec

export interface Editor<T, V, Cl> {
    el: HTMLInputElement
    cell: CellState<T, V, Cl>
}

// the cell state will exist in the shared worker
// editors will exist in the browser tabs. we need to be able to post transactions to the shared worker.

export function createCell<T, K, C = Committer>(db: Dbms,
    table: DbTable<T, K>,
    attr: (keyof T), key: K) {

    const s = ""
    const r: CellState = {
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

type refset<T> = (el: T) => void

// a dbstr needs to have enough informtion to update the database.
// it also needs to be able to populate a transaction in memory, 
export type dbstrDb = {
    table: DbTable<any, any>
    key: any
}

// db str needs to be a wrapper around a cellstate, the cell state may be on a remote server, an in-memory cell, or a local cell.
export interface CellOptions {
    name: string,
    label?: string,
    placeholder?: string,
    default?: string,
    validate?: z.ZodString,
    autocomplete?: string
    type?: string
    topAction?: () => JSXElement
}

export interface Cell extends CellOptions {
    commit(s: string): Promise<void>
    listen(cb: (v: string) => void): void
    value(): string
}

// is this only for in-memory, or is there a better way to link directly to a database?
// should we be use named parameters here?
export function cell(props: CellOptions): Cell {
    // use array here so we can point to it? is there a cheaper way?
    //let v: string[] = [props?.default ?? ""]
    const [v, setV] = createSignal(props?.default ?? "")
    return {
        ...props,
        validate: props?.validate || z.string(),
        commit: async (ts: string) => {
            console.log("commit", ts)
            setV(ts)
        },
        listen: (cb: (val: string) => void) => {
            // not called.
        },
        value: () => v()
    }
}

export function createEditor(d: Cell, setError: (s: string) => void): [refset<HTMLInputElement>] {

    return [(el: HTMLInputElement) => {
        d.listen((v: string) => {
            el.value = v
        })
        el.addEventListener('input', async (e: any) => {
            const v = e.target?.value
            const r = d.validate!.safeParse(v)
            setError(r.success ? '' : r.error.message)
            d.commit(v)
        })
    }]
}
