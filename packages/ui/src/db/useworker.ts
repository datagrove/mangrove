
import { Sequencer } from "./sequencer"
import { encode, decode } from 'cbor-x'

// accepts steps in order, or rejects them.
// Each committer can create a eqivalent snapshot stream
// use lock interface here?
import Shared from './shared?sharedworker'
import { Tx } from "../dbt/tree"
import { Watch, toBytes } from "./data"
import { set, z } from "zod"
import { l } from "../i18n/en"
import { JSXElement, createSignal } from "solid-js"
import { Cell } from "./client"
import { UpdateRow, RpcService, NotifyHandler } from "../core/socket"

export class SendToWorker {
    nextId = 1
    reply = new Map<number, [(data: any) => void, (data: any) => void]>()
    onmessage_ = new Map<string, NotifyHandler>()
    // listens are call backs tied to a negative id.
    listen = new Map<number, (r: UpdateRow<any>[]) => void>()
    mock = new RpcService()
    port: (data: any) => void // Worker|SharedWorker

    constructor(port: (data: any) => void) {
        this.port = port
    }

    //mock = new Map<string, MockHandler>
    static async worker(w: Worker): Promise<SendToWorker> {

        const r = new SendToWorker((data: any) => w.postMessage(data))
        w.onmessage = async (e: MessageEvent) => {
            r.recv(e)
        }
        return r
    }
    static async shared(w: SharedWorker): Promise<SendToWorker> {
        w.port.start()
        const r = new SendToWorker((data: any) => w.port.postMessage(data))
        w.port.onmessage = async (e: MessageEvent) => {
            r.recv(e)
        }
        return r
    }



    async recv(e: MessageEvent) {
        // we need to parse the message.
        // split at '\n', first part is json, second part is binary
        console.log('got', e)

        let data: any
        if (typeof e.data === "string") {
            const txt = await e.data
            data = JSON.parse(txt)
        }
        else {
            const b = await e.data.arrayBuffer()
            data = decode(new Uint8Array(b))
        }

        // listening uses id < 0
        if (data.id) {
            if (data.id < 0) {
                const r = this.listen.get(data.id)
                if (r) {
                    r(data.result)
                } else {
                    console.log("no listener", data.id)
                }
            } else {
                const r = this.reply.get(data.id)
                if (r) {
                    this.reply.delete(data.id)
                    if (data.result) {
                        console.log("resolved", data.result)
                        r[0](data.result)
                    } else {
                        console.log("error", data.error)
                        r[1](data.error)
                    }
                    return
                } else {
                    console.log("no awaiter", data.id)
                }
            }
        } else {
            console.log("no id")
        }
    }

    async rpc<T>(method: string, params?: any): Promise<T> {
        const o = this.mock.get(method)
        if (o) {
            return await o(params) as T
        } else {
            console.log("send", method, params)
            const id = this.nextId++
            this.port(structuredClone({ method, params, id: id }))
            return new Promise<T>((resolve, reject) => {
                this.reply.set(id, [resolve, reject])
            })
        }
    }

    //
}

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
export function createEditor(d: Cell, setError: (s: string) => void): [refset<HTMLInputElement>] {

    return [(el: HTMLInputElement) => {
        d.listen((v: string) => {
            el.value = v
        })
        el.addEventListener('input', async (e: any) => {
            const v = e.target?.value
            const r = d.validate!.safeParse(v)
            setError(r.success ? '' : r.error.message)
            d.setValue(v)
        })
    }]
}