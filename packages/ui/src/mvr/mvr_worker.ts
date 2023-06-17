
import { map } from 'zod';
import { Channel, Peer, Service, WorkerChannel, apiCall, apiListen } from '../abc/rpc';
import { createSharedListener } from '../abc/shared';

import { LensApi, Op, DgElement, lensApi, LensServerApi, ServiceApi, DgSelection, Upd, KeyMap } from './mvr_shared';

import { sample } from './mvr_test'
import { SerializedElementNode } from 'lexical';
import { createSignal } from 'solid-js';
import { TableUpdate, Tx, Tx2 } from '../dblite';

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


const  lww_write: MergeFn = (ctx: MergeContext, v:Mvr,  pr?: DgElement) =>{
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
    _proposal : MvrProposal[] = []
    _el: DgElement|null = null

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
                let mvr : Mvr|undefined = this._doc.get(o.id)
                if (!mvr) {
                    mvr = new Mvr()
                    this._doc.set(o.id, mvr)
                }
                fn(mc, mvr, o.v)
            } else {
                // we are deleting values only, but it may not delete the element if there are other values.
                let mvr : Mvr|undefined = this._doc.get(o.id)
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

            const del2 : string[] = []
            const upd2 : DgElement[] = []

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
            const map_update = await b.api.update([],upd2, del2, [])
            for (let [gid, lex] of map_update) {
                const mvr = this._doc.get(gid)
                if (!mvr) {
                    console.log("unknown gid from lexical", gid)
                    continue
                }
                b.keyMap.set(lex, mvr )
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
class BufferState  {
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
    async updatex( upd: DgElement[], del: string[], sel: DgSelection): Promise<void> {
        console.log("update from lexical", upd, del, sel)
        this.doc.trigger()
        // all these elements are coming with a lexical id. If they are inserts we need to give them a global id
        const upd2 : DgElement[] = []
        const del2 : string[] = []
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
                console.log("New element",o)
                const n = `${next++}`
                const mvr = new Mvr(o)
                this.keyMap.set(o.id, mvr)
                this.revMap.set(n, o.id)
                upd2.push(o)
            } else {
                const x = mvr._el as any
                console.log("old/new", x,o)
                const y = o as any
                if (x.text != y.text) {
                    console.log("changing text ",x.text, y.text)
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
        for (let [gid,lid] of key) {
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

interface Schema {

}

// we need a commit locally that should succeed and a remote commit that may need to be retried
// retrying requires a rebase
class Db {
    //
    commit(tx: Tx2) {
        // there are special site ids

    }

}



// the mvr server wraps around the database server?
// will the elements be available as tuples or only in documents?
export class MvrServer implements Service {
    ds = new Map<string, DocState>();
    changed =  createSignal(0)
    db = new Db()

    trigger() {
        this.changed[1](this.changed[0]() + 1)
    }
    async schema(siteServer: string) : Promise<Schema>{
        return {}
    }

    // SubscriberApi
    async sync(server: string, site: number, length: number,tail: Uint8Array) {
        // read the new entries and write to local database

        // 
    }

    // the path here needs to give us the address of a cell in the database.
    // should it be structured, or parsed string? We probably need a string in any event so we can use it in the url
    // site.server.com/table?key{x}=value|value&attr=name
    // site.server.com/edit/table/key/attr/value/value/value
    async open(url: string, mp: MessagePort): Promise<DgElement[]>  {

        const u = new URL(url)
        // site can be in parameters or part of domain.
        const site = u.searchParams.get("site")
        const siteServer = site + u.hostname
        const sch =  await this.schema(siteServer)
        // the first part of path is ignored, it is used for the tool that uses the value.
        const path = u.pathname.split("/").slice(1)
        const [table,key, attr, ...value] = path
        //return [(x:any)=>{}]

        console.log("worker open", path, mp)
        if (!(mp instanceof MessagePort))
            throw new Error("expected message port")
        let doc = this.ds.get(url)
        if (!doc) {
            doc = new DocState()
            this.ds.set(url, doc)
        }
        const bs = new BufferState(this, mp, doc)
        //this.bs.add(bs)
        doc._buffer.add(bs)
        this.trigger()
        doc.trigger()
        return doc.toJson()
    }

    // one per tab
    connect(ch: Channel): ServiceApi {
        console.log("worker connected")
        const r: ServiceApi = {
            open: this.open.bind(this),
        }
        return r
    }
    disconnect(ch: Channel): void {
        // not used, workers don't have disconnect (sockets do, thus the api)
    }
}

if (!self.document) {
    createSharedListener(new MvrServer())
}





