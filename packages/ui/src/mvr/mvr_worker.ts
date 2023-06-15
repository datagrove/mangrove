
import { map } from 'zod';
import { Channel, Peer, Service, WorkerChannel, apiCall, apiListen } from '../abc/rpc';
import { createSharedListener } from '../abc/shared';

import { LensApi, Op, DgElement, lensApi, LensServerApi, DgRangeSelection, ServiceApi, DgSelection, Upd } from './mvr_shared';

import { sample } from './mvr_test'
import { SerializedElementNode } from 'lexical';

//export type DgDoc = { [key: string] : DgElement }




interface MvrProposal {
    tagName: string
    children: string[]  // swizzle to _children: MvrProposal[]?
    [key: string]: any
}

export interface Mvrdoc {
    [key: string]: Mvr
}
// locally it's just lww, no merging. buffers send exact ops to the shared worker, the 
// call back to client with new ops, or new path open.
type Rop = {
    pk: string
    id: string
    dv: number  // device
    rm: number[] // pairs of numbers.
    rv: number[]
    v?: DgElement
}
class Mvr {
    _proposal = new Map<number, MvrProposal>()
    _el: DgElement = {
        id: '',
        v: 0,
        conflict: '',
        tagName: '',
        class: '',
        children: []
    }
}

// startup is awkward; we want to load the document, but that doesn't give us the key map we need. when we subscribe we can get the map.
export class DocState {
    _doc = new Map<string, Mvr>()
    _buffer = new Set<BufferState>()
    constructor() {
        lexicalToDg(sample)
    }


    merge_remote(op: Rop[]) {
        let del: string[] = []
        let upd: DgElement[] = []
        for (let o of op) {
            let e = this._doc.get(o.id)
            if (!e) {
                e = new Mvr()
                this._doc.set(o.id, e)
            }
            if (o.v) {
                e._proposal.set(o.dv, o.v)
            }

            for (let i = 0; i < o.rv.length; i++) {
                const p = e._proposal.get(o.rm[i])
                if (p && p.v <= o.rv[i]) {
                    e._proposal.delete(o.rm[i])
                }
            }
            if (e._proposal.size === 0) {
                this._doc.delete(o.id)
            }
            else if (e._proposal.size === 1) {
            } else if (e._proposal.size > 1) {
                // merge
            }
        }
        this.broadcast(null, del, upd)
    }
    async broadcast(from: BufferState | null, del: string[], upd: DgElement[]) {
        upd = topologicalSort(upd)
        for (let b of this._buffer) {
            if (b !== from) {
                del = del.map(d => b.keyMap.get(d) || d)
                del.forEach(d => b.revMap.delete(d))
                upd.forEach(u => {
                    u.id = b.revMap.get(u.id) || u.id
                })
            }
            const map_update = await b.api.update(upd, del, null)
            for (let [gid, lex] of map_update) {
                b.keyMap.set(lex, gid)
                b.revMap.set(gid, lex)
            }
        }


    }
}


let next = 0
class BufferState implements LensServerApi {
    // lexical keys to global keys
    keyMap = new Map<string, string>()
    // global keys to lexical keys for this buffer.
    revMap = new Map<string, string>()

    api: LensApi
    constructor(public ps: PeerServer, mp: MessagePort, public doc: DocState) {
        const w = new Peer (new WorkerChannel(mp))
        this.api = lensApi(w)
        apiListen<LensServerApi>(w, this)
    }
    async update(ops: (string | DgElement)[], sel: DgRangeSelection): Promise<void> {
        // all these elements are coming with a lexical id. If they are inserts we need to give them a global id
        let del: string[] = []
        let upd: DgElement[] = []
        for (let o of ops) {
            if (typeof o === "string") {
                const gid = this.keyMap.get(o)
                if (gid) {
                    del.push(gid)
                    this.keyMap.delete(o)
                    this.revMap.delete(gid)
                }
            } else {
                const id = this.keyMap.get(o.id)
                if (id) {
                    upd.push(o)
                } else {
                    const n = `${next++}`
                    this.keyMap.set(o.id, n)
                    this.revMap.set(n, o.id)
                    upd.push(o)
                }
            }
        }
        this.doc.broadcast(this, del, upd)
    }
    // this is like the first update, it gives us all the lex keys for the document
    async subscribe(key: [string, string][]): Promise<void> {
        // we shouldn't send updates until we get this call
    }
    async close(): Promise<void> {
        // this should reference count the doc
    }
}

// give every node an id. 
let _next = 0
function lexicalToDg(lex: any): DgElement[] {
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
            children: id
        } as any)
        return key
    }
    copy1(lex, "")
    return dgd
}

class PeerServer implements Service {
    ds = new Map<string, DocState>();

    // one per tab
    connect(ch: Channel): ServiceApi {
        console.log("worker connected")
        const r: ServiceApi = {
            open: async (path: string, mp: MessagePort ): Promise<DgElement[]> => {
                console.log("worker open", path, mp)
                if (!(mp instanceof MessagePort))
                    throw new Error("expected message port")
                let doc = this.ds.get(path)
                if (!doc) {
                    doc = new DocState()
                    this.ds.set(path, doc)
                }
                new BufferState(this, mp, doc)
                return []
            },
        }
        return r
    }
    disconnect(ch: Channel): void {
        // not used, workers don't have disconnect (sockets do, thus the api)
    }
}

createSharedListener(new PeerServer())


function topologicalSort(elements: DgElement[]): DgElement[] {
    const visited: { [id: string]: boolean } = {};
    const sorted: DgElement[] = [];

    const visit = (element: DgElement) => {
        if (visited[element.id]) {
            return;
        }

        visited[element.id] = true;

        for (const childId of element.children) {
            const child = elements.find((e) => e.id === childId);

            if (child) {
                visit(child);
            }
        }

        sorted.push(element);
    };

    for (const element of elements) {
        visit(element);
    }

    return sorted.reverse();
}

console.log("worker started")