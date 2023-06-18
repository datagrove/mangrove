
import { Channel, Peer, Service, WorkerChannel, apiListen } from '../abc/rpc';
import { createSharedListener } from '../abc/shared';

import { LensApi, DgElement, lensApi, LensServerApi, ServiceApi, DgSelection, ValuePointer, ScanQuery, Schema, TableUpdate, binarySearch, QuerySchema, Txc, TuplePointer, TabStateApi, tabStateApi, SubscriberApi, subscriberApi, CommitApi, Etx, OpfsApi } from './mvr_shared';
import { SerializedElementNode } from 'lexical';

import { DgServer, PinnedTuple, Subscription, drivers } from './mvr_worker_db';
import { IntervalTree } from './itree';
import { createSignal } from 'solid-js';
import { DbLite } from './sqlite_worker';
import { encode } from 'cbor-x';
import { sample } from './mvr_test';

// we need to support different storage hosts, for testing purposes we should assume something like R2. The lock server will point us to the log host and the tail host.




// locally it's just lww, no merging. buffers send exact ops to the shared worker, the 
// call back to client with new ops, or new path open.
// each version is identified by a (gsn-read, gsn-written) segment
// a version (r1,w1) automatically supercedes (r0,w0) if r1 >= w0 
type Rop = {
    op: string
    pk: string  // site/table/primary key/attr
    id: string  // gid of the element
    dv: number  // device making the proposal. This would need to be version too, if we get away from serial order.
    rd: number[] // version to remove
    wr: number[] // device that made the revision we are replacing.
    // empty to delete
    v?: DgElement
}

class MergeContext {
    _read = 0
    _write = 0

    // we can have a dictionary of operations, subsuming type set
    op: {
        [pk: string]: MergeFn
    } = {
            "lww": lww_write
        }
}

// some merge functions need more context then just the set of current proposals.
export type MergeFn = (ctx: MergeContext, v: Mvr, arg?: DgElement) => void


const lww_write: MergeFn = (ctx: MergeContext, v: Mvr, pr?: DgElement) => {
    const bs = v._proposal.filter(e => e.written > ctx._read)
    if (pr) {
        v._proposal = bs.concat({
            read: ctx._read,
            written: ctx._write,
            v: pr
        })
        v._el = pr
    }
    else {
        v._proposal = bs
        v._el = v._proposal.length > 0 ? v._proposal[v._proposal.length - 1].v : null
    }

}

class Mvr {
    // one for each concurrent device, need another approach for 3-way merge. gsn maybe?
    _proposal: MvrProposal[] = []
    _el: DgElement | null = null

    constructor(el?: DgElement) {
        if (el) {
            this._el = el
            this._proposal.push({
                read: 0,
                written: 0,
                v: el
            })
        }
    }
    get gid() { return this._el!.id }
}
interface MvrProposal {
    read: number
    written: number
    v: DgElement
}
// startup is awkward; we want to load the document, but that doesn't give us the key map we need. when we subscribe we can get the map.
export class DocState {
    _doc = new Map<string, Mvr>()
    _buffer = new Set<BufferState>()
    changed = createSignal(0)

    trigger() {
        this.changed[1](this.changed[0]() + 1)
    }

    // whenever we add a proposal to a mvr we need to commit it to disk
    // after committing it to disk we will write it to the cloud. Cloud writes may fail and need retrying.


    constructor() {
        // our canonical document will read to keep the read and write values of the mvr
        // we can fake those on import.
        const o = lexicalToDg(sample)
        for (let e of o) {
            this._doc.set(e.id, new Mvr(e))
        }
    }

    toJson(): DgElement[] {
        console.log("doc", this._doc)
        return Array.from(this._doc.values()).map(m => m._el!)
    }

    // merge remote ops come from reading the cloud log.
    async merge_remote(mc: MergeContext, op: Rop[]) {
        let del: string[] = []
        let upd: DgElement[] = []
        for (let o of op) {
            const fn = mc.op[o.op]
            if (!fn) {
                console.log("unknown op", o.op)
                continue
            }
            if (o.v) {
                let mvr: Mvr | undefined = this._doc.get(o.id)
                if (!mvr) {
                    mvr = new Mvr()
                    this._doc.set(o.id, mvr)
                }
                fn(mc, mvr, o.v)
            } else {
                // we are deleting values only, but it may not delete the element if there are other values.
                let mvr: Mvr | undefined = this._doc.get(o.id)
                if (!mvr) {
                    console.log("delete on unknown id", o.id)
                    continue
                }
                fn(mc, mvr)
            }
        }
        await this.broadcast(null, del, upd)
    }

    async broadcast(from: BufferState | null, del: string[], upd: DgElement[]) {
        console.log("BROADCAST", del, upd, this._buffer)
        for (let b of this._buffer) {
            if (b === from)
                continue

            const del2: string[] = []
            const upd2: DgElement[] = []

            // be sure to complete the broadcast before deleting from the document map
            for (let d of del) {
                const lid = b.keyMap.get(d)?.gid || d
                del2.push(lid)
                b.revMap.delete(lid)
            }

            for (let u of upd) {
                const u2 = {
                    ...u,
                    id: b.revMap.get(u.id) || u.id
                }
                upd2.push(u2)
            }

            // map update returns the keys that lexical assigned to the new elements
            const map_update = await b.api.update([], upd2, del2, [])
            for (let [gid, lex] of map_update) {
                const mvr = this._doc.get(gid)
                if (!mvr) {
                    console.log("unknown gid from lexical", gid)
                    continue
                }
                b.keyMap.set(lex, mvr)
                b.revMap.set(gid, lex)
            }

        }
        // now the broadcast is complete we can delete from the document map
        // this will change though with cloud state
        del.forEach(d => {
            this._doc.delete(d)
        })
        this.trigger()
    }
}


let next = 0
class BufferState {
    // we can eliminate this mapping by forking lexical and putting the vdom in the shared worker
    // lexical keys to global keys
    keyMap = new Map<string, Mvr>()
    // global keys to lexical keys for this buffer.
    revMap = new Map<string, string>()

    api: LensApi
    constructor(public ps: MvrServer, mp: MessagePort, public doc: DocState) {
        console.log("BUFFER ADDED", doc._buffer.size)
        const w = new Peer(new WorkerChannel(mp))
        this.api = lensApi(w)
        const r: LensServerApi = {
            update: this.updatex.bind(this),
            subscribe: this.subscribex.bind(this),
            close: this.closex.bind(this)
        }
        apiListen<LensServerApi>(w, r)
    }
    async updatex(upd: DgElement[], del: string[], sel: DgSelection): Promise<void> {
        console.log("update from lexical", upd, del, sel)
        this.doc.trigger()
        // all these elements are coming with a lexical id. If they are inserts we need to give them a global id
        const upd2: DgElement[] = []
        const del2: string[] = []
        for (let o of del) {
            const mvr = this.keyMap.get(o)
            if (mvr) {
                this.keyMap.delete(o)
                this.revMap.delete(mvr.gid)
                del2.push(mvr.gid)
            }
        }
        for (let o of upd) {
            const mvr = this.keyMap.get(o.id)
            if (!mvr) {
                console.log("New element", o)
                const n = `${next++}`
                const mvr = new Mvr(o)
                this.keyMap.set(o.id, mvr)
                this.revMap.set(n, o.id)
                upd2.push(o)
            } else {
                const x = mvr._el as any
                console.log("old/new", x, o)
                const y = o as any
                if (x.text != y.text) {
                    console.log("changing text ", x.text, y.text)
                    // not right, we need to update the mvr
                    x.text = y.text
                    upd2.push({
                        ...o,
                        id: mvr.gid
                    })
                }
            }
        }

        this.doc.broadcast(this, del2, upd2)
    }
    // this is like the first update, it gives us all the lex keys for the document
    async subscribex(key: [string, string][]): Promise<void> {
        for (let [gid, lid] of key) {
            this.keyMap.set(lid, this.doc._doc.get(gid)!)
            this.revMap.set(gid, lid)
        }
    }
    async closex(): Promise<void> {
        this.doc._buffer.delete(this)
        //this.ps.bs.delete(this)
    }


}

// give every node an id. 
let _next = 422
// does not need to be sorted. it wil push children first
function lexicalToDg(lex: SerializedElementNode): DgElement[] {
    let dgd: DgElement[] = []

    const copy1 = (a: SerializedElementNode, parent: string): string => {
        const key = `${_next++}`
        const id: string[] = []
        if (a.children) {
            for (let k of a.children) {
                id.push(copy1(k as any, key))
            }
        }
        dgd.push({
            ...a,
            id: key,
            children: id
        } as any)
        return key
    }
    copy1(lex, "")
    // console.log("convert to dg", dgd.map(d => [ d.id,...d.children]))
    return dgd
}

// to watch the database state, we want a signal for when the buffer state or the doc state changes



// we need to initialize the MvrServer with a host for its user configuration
// from there we can access other servers, but we need to store data to share among the user's devices


// we can broadcast service status and range versions


// each worker runs a lock server over webrtc
// we can subset the reliable ones and shard the locks.
// 

class LockClient {
    api: SubscriberApi
    constructor(ch: Channel) {
        this.api = subscriberApi(new Peer(ch))
    }
}


export interface MvrServerOptions {
    leader?: Channel
    // host overrides the self.origin
    origin?: string
    // local dns remapping 
    remapHost?: {
        [key: string]: string
    }
}

// the mvr server wraps around the database server?
// will the elements be available as tuples or only in documents?
export class MvrServer implements Service {
    client = new Set<LockClient>()
    lock = new Map<number, Map<number, number>>()
    log = new Map<number, Uint8Array>()
    watchers = new Map<string, Uint8Array>()
    logApi? : OpfsApi

    constructor(public opt?: MvrServerOptions) {
        if (!opt) {
            opt = {}
        }
        // connect to the host server in the 
    }

    connectWebrtc(ch: Channel): CommitApi {
        const r1: CommitApi = {
            commit: this.remoteCommit.bind(this),
        }
        this.client.add(new LockClient(ch))
        return r1
    }

    disconnectWebRtc(ch: Channel): void {
        this.client.delete(new LockClient(ch))
    }

    async remoteCommit(tx: Etx): Promise<number> {
        const lockmap = this.lock.get(tx.id)
        if (!lockmap) { return -a }

        for (let lk of tx.lock) {
            const v = lockmap.get(lk)
            if (v && v != tx.lockValue[0]) {
                return -1
            }
        }
        for (let lk of tx.lock) {
            lockmap.set(lk, tx.lockValue[0] + 1)
        }

        let log = this.log.get(tx.id)
        if (!log) {
            log = new Uint8Array(0)
        }
        log = concat(log, tx.data)
        this.log.set(tx.id, log)
        return log.length
    }



    server = new Map<string, DgServer>()
    ds = new Map<string, DocState>();
    changed = createSignal(0)
    bc = new BroadcastChannel('dgdb')

    db?: DbLite


    avail = new Map<string, number>()

    sv(url: string): DgServer {
        const connect = async (host?: string, driver?: string) => {
            const s = new DgServer()
            this.server.set(host ?? self.origin, s)
            return s
        }

        let sx = this.server.get(url)
        if (!sx) {
            sx = new DgServer()
            this.server.set(url, sx)
        }
        return sx
    }

    getTable(server: string, site: string, table: string): IntervalTree<Subscription> {
        throw new Error("Method not implemented.");
    }


    trigger() {
        this.changed[1](this.changed[0]() + 1)
    }

    notifyStatus() {
        this.bc.postMessage({
            server: [...this.server.keys()],
            //up: [...server.values()].filter(x => x.isConnected).map(x => x.url)
        })
    }

    // generally we get the driver from the host, but if we are offline can we do this?
    // we also need a device id and a user identity.
    // can we do anything before we get these? but we need to start somehow.

    // default to self.orgin. if you don't have a device id, ask for one. (how do we do this in vite?)

    // merge this with the database functionality

    async schema(siteServer: string): Promise<Schema> {
        const r: Schema = {
            create: [],
            view: {},
            functor: {}
        }
        return r
    }

    async openRange(q: ScanQuery<any, any>, mp: MessagePort) {

    }

    // we don't need an interval tree? we need a hash table of all the ids on the screen that could need to be signaled.
    cacheKey(tx: TuplePointer) {
        return tx.join(",")
    }

    // global database update. we need to make sure to update subcribers
    commit(tx: Txc) {
        if (!this.db) throw new Error("No database")


        const sql = []
        for (const [site, method, ...a] of tx) {
            sql.push("insert into log(site, entry) values (?,?)", [site, encode(tx)])
            // executing the functor should return an array of tuple pointers. if any of these are in our cache we need to invalidate them. alternately we can pass this class to the proc and then the proc can manage invalidation.
        }

    }

    async open(url: ValuePointer, mp: MessagePort): Promise<DgElement[] | string> {
        if (!(mp instanceof MessagePort)) throw new Error("expected message port")
        const cachekey = url.join("/")
        // check our cache, if not found instantiate a new one. 
        let doc = this.ds.get(cachekey)
        if (!doc) {
            doc = new DocState()
            // load the value from our local store if available, otherwise load from the server if a snapshot is available, otherwise we return unavailable arror.

            this.ds.set(cachekey, doc)
        }

        // create a new buffer state for this document
        const bs = new BufferState(this, mp, doc)
        doc._buffer.add(bs)

        // notify the debugger
        this.trigger()
        doc.trigger()
        return doc.toJson()
    }

    tab = new Map<Channel, TabStateApi>()
    leader?: TabStateApi
    // one per tab, if there is no db we can now ask for one
    async connect(ch: Channel): Promise<ServiceApi> {
        console.log("worker connected")
        
        const peer = new Peer(ch)
        const r: ServiceApi = {
            open: this.open.bind(this),
        }
        apiListen<ServiceApi>(peer, r)

        const api = tabStateApi(peer)
        this.tab.set(ch, api)
        if (!this.leader) {
            this.leader = api
            console.log("creating db")
            const [db,log] = await this.leader.createDb()
            console.log("created db",db,log)
            this.db = db
            this.logApi = log

            const h = await log.create("test")
            await log.write(h, new Uint8Array([1, 2, 3]))
            const r = log.read(h,0, 3)
            console.log(r)
        }

        return r
    }
    async disconnect(ch: Channel): Promise<void> {
        const api = this.tab.get(ch)
        if (!api) return
        // not used, workers don't have disconnect (sockets do, thus the api)
        this.tab.delete(ch)
        if (this.leader == api) {
            await this.db?.close()
            if (this.tab.size) {
                this.leader = this.tab.values().next().value
                this.db = await this.leader!.createDb()
            }
        }
    }
}

export async function createMvrServer() {
    return new MvrServer()
}
if (!self.document) {
    // if we are a worker
    createMvrServer().then(e => createSharedListener(e))
}





function concat(a: Uint8Array, b: Uint8Array) {
    var c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c
}

const tostr = async (data: Uint8Array): Promise<string> => {
    // Use a FileReader to generate a base64 data URI
    const base64url = (await new Promise((r) => {
        const reader = new FileReader()
        reader.onload = () => r(reader.result as any)
        reader.readAsDataURL(new Blob([data]))
    })) as string

    /*
    The result looks like 
    "data:application/octet-stream;base64,<your base64 data>", 
    so we split off the beginning:
    */
    return base64url.substring(base64url.indexOf(',') + 1)
}

class SiteLog {
    data = new Uint8Array(0)
    append(data: Uint8Array) {
        this.data = concat(this.data, data)
    }
}
class Keeper {
    site = new Map<string, SiteLog>()
}