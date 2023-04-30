import { Component, JSXElement, Resource, Setter, Signal, createResource, createSignal, onCleanup } from 'solid-js'
import { Ws, getWs } from './socket'
import { decode, encode } from 'cbor-x';

// when we pop up dialogs they can get a ws for whatever is the current database

const dbCache = new Map<string, Database>()
const present = new Map<string, PresentationCache<any>>()
const byHandle = new Map<number, PresentationCache<any>>()

// a database allows ACID transactions
export class Database {
    view = new Map<string, Query<any>>()
    constructor(public url: string) {

    }
}

export class Snapshot<T> {
    constructor(public id: Uint8Array) {

    }
}

export class Query<T> {
    sn: Snapshot<T>

    constructor(snapshotId: Uint8Array) {
        this.sn = new Snapshot<T>(snapshotId)
    }
}


export interface Presentation<T> {
    loading: boolean
    error: string
    prc: PresentationCache<T>
    cacheKey: string
    mutate?: Setter<Presentation<T>>
    length: number
    anchor: null // this is top of runway, it may not be visible
    top: number // this is the top of the visible area
}
export function rows<T>(p: Presentation<T>) : T[] {
    return []
}

export class PresentationCache<T> {
    snapshot = ""
    subscribed = false
    pr = new Set<Presentation<T>>()
    value: T[] = []
    constructor(db: Database,public url: string) {
    }
}

// update events stream back from Ws
interface UpdateEvent {
    handle: number
}
export function update(ev: UpdateEvent[]) {
    // update value

    // update each presentation of the table
    for (let e of ev) {
        let prc = byHandle.get(e.handle)
        if (!prc) continue

        // we need to make this a new value
        prc.pr.forEach(e => {
            const n  = { ...e }
             e.mutate!(n as any)
        })
    }
}

// it's not clear that this should have T?
// a presentation has a current query, it may share queries
// although this seems unlikely to be helpful

// Presentation is immutable, the wrapped cache may have mutation.

// this is what the resource needs to provide, like code mirror editor for document.



// we need a callback that allows us to attempt logging 
// this can be called in the background but require the user's assistance
// this needs to wrap, like a router, w-full, h-full?
// to log into a random server maybe use a uuid? a proven owned phone number? public key from bip?
// we can probably insert a layer for this, find it with a global id.
export const Datagrove: Component<{children: JSXElement}> = (props) => {
    return <div id='datagrove'></div>
}

async function  cleanupPresentation(pr: Presentation<any>) {
    pr.prc.pr.delete(pr)
    if (pr.prc.pr.size == 0) {
        present.delete(pr.prc.url)
        const ws = await getWs(pr.prc.url)
        await ws.rpc<any>('release', pr.prc.url)
    }
}
// maybe here url needs to specify the server/org/database/-schema, because Pt<T> can't
export function createPresentation<T,A>(pt: Pt<T,A>, url: string, a?: A) : Signal<Presentation<T>>{

    let dbkey = url
    let db = dbCache.get(dbkey)
    if (!db) {
        db = new Database(dbkey)
        dbCache.set(dbkey, db)
    }
    let prc = present.get(url) //
    if (!prc) {
        prc = new PresentationCache<T>(db,url)
        present.set(url, prc)
    }
    const pr : Presentation<T>= {
        loading: true,
        error: "",
        prc: prc,
        cacheKey: '',
        length: 0,
        anchor: null,
        top: 0
    } 
    const r = createSignal<Presentation<T>>(pr)
    const [_,setR] = r
    pr.mutate = setR
    prc.pr.add(pr)
    onCleanup(() => cleanupPresentation(pr))

    // call mutate from the websocket notification after we update the presentation.
    return r
}

export type Pt<T,A={}> = { table: string }

// packs in table and key
type Key = Uint8Array
type Value = Uint8Array // cbor?
export class Tx {

    functor: Uint8Array[] = []

    constructor(public url: string) {

    }
    // potentially each tuple needs an encoder?
    // maybe just wrap a [ url.table, Partial<Tuple>, update|delete|insert ]
    // and let the receiver figure it out.
    update<T>(pt: Pt<T>, data: Partial<T>)  {
        let k = encode([this.url, pt.table, data,1])
        this.functor.push(encode(k))
        return this
    }
    insert<T>(pt: Pt<T>, data: Partial<T>)  {
        let k = encode([this.url, pt.table, data,0])
        this.functor.push(encode(k))
        return this
    }
    delete<T>(pt: Pt<T>, data: Partial<T>)  {
        let k = encode([this.url, pt.table, data,2])
        this.functor.push(encode(k))
        return this
    }
    exec<T>(pt: Pt<T>, data: T)  {
        let k = encode([this.url, pt.table, data,3])
        this.functor.push(encode(k))
        return this
    }
    commit(){
        let ws = getWs(this.url)
        ws.rpc('tx', this.functor)
    }
}





// this could just be a cbor encoded array of operations (functors)



/*

    add(l: Presentation<T>) {
        this.pr.push(l)
    }
    remove(l: Presentation<T>) {
        this.pr = this.pr.filter(e => e !== l)
        if (this.pr.length == 0) {
            present.delete(this.name)
        }
    }

export type Upd<T> = { ptu: string }
// updators need to operate on a transaction.
export class Updater<T> {

}

export function createUpdater<T>(ud: Upd<T>) {
    return new Updater<T>
}


    if (!prc.subscribed) {
        present.set(url, prc)
        prc.subscribed = true
    }

    const fn = async () => {
        if (!prc!.value) {
            const ws = await getWs(url)
            prc!.snapshot = await ws.rpc<any>('watch', url)
        }
        return pr
    }
*/