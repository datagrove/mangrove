
import { map } from 'zod';
import { Channel, Peer, Service, WorkerChannel, apiCall, apiListen } from '../abc/rpc';
import { createSharedListener } from '../abc/shared';

import { LensApi, Op, DgElement, lensApi, LensServerApi, DgRangeSelection, ServiceApi, DgSelection, Upd, KeyMap } from './mvr_shared';

import { sample } from './mvr_test'
import { SerializedElementNode } from 'lexical';

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


    merge_remote(mc: MergeContext, op: Rop[]) {
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
        this.broadcast(null, del, upd)
    }

    async broadcast(from: BufferState | null, del: string[], upd: DgElement[]) {
        console.log("BROADCAST", del, upd, this._buffer)
        for (let b of this._buffer) {
            if (b === from) 
                continue

            del = del.map(d => b.keyMap.get(d) || d)
            del.forEach(d => b.revMap.delete(d))
            upd.map(u => {
                return {
                    ...u,
                    id: b.revMap.get(u.id) || u.id
                }
            })

          
            const map_update = await b.api.update(upd, del, null)
            console.log("map update", map_update)
            if (map_update) {
                for (let [gid, lex] of map_update) {
                    b.keyMap.set(lex, gid)
                    b.revMap.set(gid, lex)
                }
            }
        }
    }
}


let next = 0
class BufferState  {
    // lexical keys to global keys
    keyMap = new Map<string, string>()
    // global keys to lexical keys for this buffer.
    revMap = new Map<string, string>()

    api: LensApi
    constructor(public ps: PeerServer, mp: MessagePort, public doc: DocState) {
        doc._buffer.add(this)
        const w = new Peer(new WorkerChannel(mp))
        this.api = lensApi(w)
        const r: LensServerApi = {
            update: this.updatex.bind(this),
            subscribe: this.subscribex.bind(this),
            close: this.closex.bind(this)
        }
        apiListen<LensServerApi>(w, r)
    }
    async updatex(upd: DgElement[], del: string[], sel: DgRangeSelection): Promise<void> {
        console.log("update", this, upd, del, sel)
       
        // all these elements are coming with a lexical id. If they are inserts we need to give them a global id
        const upd2  : DgElement[] = []
        const del2 : string[] = []
        for (let o of del) {
            const gid = this.keyMap.get(o)
            if (gid) { 
                this.keyMap.delete(o)
                this.revMap.delete(gid)
                del2.push(gid)
            }
        }
        for (let o of upd) {
            const id = this.keyMap.get(o.id)
            if (!id) {
                const n = `${next++}`
                this.keyMap.set(o.id, n)
                this.revMap.set(n, o.id)
                upd2.push(o)
            }
        }

       this.doc.broadcast(this, del2, upd2)
    }
    // this is like the first update, it gives us all the lex keys for the document
    async subscribex(key: [string, string][]): Promise<void> {
        // we shouldn't send updates until we get this call
    }
    async closex(): Promise<void> {
        this.ps.bs.delete(this)
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
    console.log("dgd", dgd.map(d => [ d.id,...d.children]))
    return dgd
}

export class PeerServer implements Service {
    ds = new Map<string, DocState>();
    bs = new Set<BufferState>()

    async open(path: string, mp: MessagePort): Promise<DgElement[]>  {
        console.log("worker open", path, mp)
        if (!(mp instanceof MessagePort))
            throw new Error("expected message port")
        let doc = this.ds.get(path)
        if (!doc) {
            doc = new DocState()
            this.ds.set(path, doc)
        }
        this.bs.add(new BufferState(this, mp, doc))
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
    createSharedListener(new PeerServer())
}





