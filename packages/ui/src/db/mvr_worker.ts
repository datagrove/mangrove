
import { Channel, Peer, Service, WorkerChannel, WsChannel, apiListen } from '../abc/rpc';
import { createSharedListener } from '../abc/shared';

import { LensApi, DgElement, lensApi, LensServerApi, ServiceApi, DgSelection, ValuePointer, ScanQuery, Schema, TableUpdate, binarySearch, QuerySchema, Txc, TuplePointer, TabStateApi, tabStateApi, PeerApi, peerApi, CommitApi, Etx, OpfsApi, opfsApi, concat } from './mvr_shared';
import { SerializedElementNode } from 'lexical';

import { DgServer, PinnedTuple, Subscription, drivers } from './mvr_worker_db';
import { IntervalTree } from './itree';
import { createSignal } from 'solid-js';
import { DbLite } from './sqlite_worker';
import { encode } from 'cbor-x';
import { sample } from './mvr_test';
import { DbLiteApi, dbLiteApi } from './sqlite_api';
import { Host, LocalCommit, RecPeer } from './logwriter';

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

export interface MvrServerOptions {
    leader?: Channel
    // host overrides the self.origin
    origin?: string
    // local dns remapping 
    remapHost?: {
        [key: string]: string
    }
}

let nserver = 0

// there can be more than one log per site with different priorities
// there can be blobs that are not in the log but referenced by it.

enum SiteStatus {
    Unknown,
    Leader,
    LocalOnly,  // this machine is the cloud, there is no cloud.
    Contributor, // using another peer as the leader

}
enum LogStatus {
    Leader,
    Contributor,
    Unknown
}

// maybe we should track these globally with site as a key prefix?
export class SiteTracker {
    status: SiteStatus = SiteStatus.Unknown
    logStatus = new Map<number, LogStatus>()
    registerStatus = new Map<string, LogStatus>()

    // if we are the leader we need to track who has leases on our registers
    registerLessee = new Map<string, RecPeer>()
    
    constructor(public ps: MvrServer,public host: Host, public id: number ) {

    }
    // this has a vale
    leader?: RecPeer
    peers = new Set<RecPeer>()
    lease: number = 0
    handle: number = 0

    at: number = 0
    log: Uint8Array = new Uint8Array(0)

    // the leader processes these. reads are best effort, and the peer can simply read from the cloud directly (we don't read on their behalf)
    async readFromPeer(peer: RecPeer) {

    }
    onNotify(stream: number, at: number, d: Uint8Array){
        // notify the mvr registers
    }
    async notifyPeers(d: Uint8Array) {
        for (let p of this.peers) {
            p.api.notify(this.id, d)
        }
    }
    async writeToLeader() {
        // if this fails we need to try to become the leader or find a new leader
        if (!this.leader) {
            [this.isLeader, this.leader] = await this.host.findLeader()
            if (!this.leader) {
                return
            }
        }
        this.leader.api.write(this.lease, this.at, this.log)
        this.at += this.log.length
    }
    async writeToCloud() {
        // when we write to the cloud we should also write to our connected peers
        // the cloud will be responsible for push messages
        if (!this.cloud)  return
        // if this fails, then we may need to give the lease.
        // how do we manage this sort of api with no return?
        this.cloud.write(this.lease, this.at, this.log)
        this.at += this.log.length
    }
}
// this is the point of contact for ui tabs calling in.
// the mvr server wraps around the database server?
// will the elements be available as tuples or only in documents?
export class MvrServer implements Service {
    //watchers = new Map<string, Uint8Array>()
    //server = new Map<string, DgServer>()
    ds = new Map<string, DocState>();
    changed = createSignal(0)
    bc = new BroadcastChannel('dgdb')
    avail = new Map<string, number>()
    tab = new Map<Channel, TabStateApi>()
    leader?: TabStateApi
    db?: DbLiteApi
    logApi? : OpfsApi    

    peer = new Map<Channel,RecPeer>() 
    host = new Map<string, Host>()
    site = new Map<string, SiteTracker>()
    lock = new Map<number, Map<number, number>>()
    uncommited = new Set<string>()

    notifyStatus() {
        this.bc.postMessage({
            server: [...this.site.keys()],
            //up: [...server.values()].filter(x => x.isConnected).map(x => x.url)
        })
    }
    
    async getLog(cacheKey: string) : Promise<SiteTracker>{
        const connectHost = async (wss: string): Promise<Host> => {
            return new Host(cloudApi(new Peer(new WsChannel(wss))))
        }
        const site = this.site.get(cacheKey)
        if (!site) {
            let cn = await connectHost(cacheKey)
            if (cn) {
                this.host.set(cacheKey, cn)
            }
        }
        return site!
    }

    connectWebrtc(ch: Channel): PeerApi {
        const o = new RecPeer(this,ch)
        this.peer.set(ch,o)
        return o.getApi()
    }

    disconnectWebRtc(ch: Channel): void {
        const o = this.peer.get(ch)
        if (o) {
            o.close()
            this.peer.delete(ch)
        }
    }

    // we restore our commits we may have some that are not globally committed

    async proposeRemoteCommits() {
        // read the tail of the log and propose them to the leader
        // transactions that are rejected are rebased and retried
        // we write the accepts/reject/rebase to our log
        // we have many logs, or just one interleaved log for a client?
        // but we are client and server, and potentially low memory, so maybe one log per site is the way to go. sqlite is also a possibility.
        
        let x : Promise<any>[] = []
        for (let o of this.uncommited) {
            const site =  await this.getLog(o)
            // if we are the leader then we can write directly to the cloud backup, no one can stop us
            // write all the logs
            if (site.isLeader){
                x.push(site.writeToCloud())
            } else if (site.leader){
                x.push(site.writeToLeader())
            }
        }
        await Promise.all(x)
    }

    async acceptLocalCommit(lc: LocalCommit) {

    }

    // when we start up we need to read the log and apply it to our btree
    // can I use leanstore style aries here? or only roll forward?
    async recover() {
    }
    constructor(public opt?: MvrServerOptions) {
        if (!opt) {
            opt = {}
        }
        // connect to the host server in the 
    }


    // sv(url: string): DgServer {
    //     const connect = async (host?: string, driver?: string) => {
    //         const s = new DgServer()
    //         this.server.set(host ?? self.origin, s)
    //         return s
    //     }

    //     let sx = this.server.get(url)
    //     if (!sx) {
    //         sx = new DgServer()
    //         this.server.set(url, sx)
    //     }
    //     return sx
    // }

    getTable(server: string, site: string, table: string): IntervalTree<Subscription> {
        throw new Error("Method not implemented.");
    }

    trigger() {
        this.changed[1](this.changed[0]() + 1)
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
            // this just transfers the ports back, we need to create peers for them here.
            const [dbp,logp]:[MessagePort,MessagePort] = await this.leader.createDb()
            dbp.start()
            logp.start()
            const pdb = new Peer(new WorkerChannel(dbp))
            const plog = new Peer(new WorkerChannel(logp))
            const db : DbLiteApi = dbLiteApi(pdb)
            const log = opfsApi(plog)

            console.log("created db",db,log)
            this.db = db
            this.logApi = log

            const h = await log.open("test"+(nserver++))
            await log.write(h, 0, new Uint8Array([1, 2, 3]))
            const r = await log.read(h,0, 3)
            console.log("BACK IN WORKER",r)
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


