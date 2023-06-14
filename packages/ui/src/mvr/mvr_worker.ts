
import { Channel, Service, WorkerChannel, apiCall, apiListen } from '../abc/rpc';
import { createSharedListener } from '../abc/shared';

import { LensApi, Op, SimpleElement, lensApi } from './mvr_shared';
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
    v?: SimpleElement
  }
class Mvr {
    _proposal = new Map<number, MvrProposal>()
 }
export class DocState {
  doc = new Map<string, Mvr >()

  update( ){

  }

  merge_remote(op: Rop[]){
    for (let o of op) {
      let e = this.doc.get(o.id)
      if (!e) {
        e = new Mvr()
        this.doc.set(o.id,e)
      }
      if (o.v)  {
        e._proposal.set(o.dv, o.v)
      }
       
      for (let i= 0; i< o.rv.length; i++) {
        const p = e._proposal.get(o.rm[i])
        if (p && p.v <= o.rv[i]) {
          e._proposal.delete(o.rm[i])
        }
      }
      if (e._proposal.size === 0) {
        this.doc.delete(o.id)
      }
      else if (e._proposal.size === 1) {
      } else if (e._proposal.size > 1) {
        // merge
      }
    }
  }

  merge_local(op: Op[]){

  }
}

class Cl {
    peer = new OmPeer()
    constructor(public api: LensApi) { }
}
class Doc {
    ds = new OmState({})
    cl = new Set<Cl>()
    rev = 0

    update (peer: OmPeer, ops: Op[])  {
        for (var i = 0; i < ops.length; i++) {
            peer.merge_op(this.ds, ops[i]);
        }
        // I think this may be a filter, so we don't send all the messages; still needed though?
        if (this.rev < this.ds.ops.length) {
            for (let o of this.cl.values()) {
                o.api.update(this.ds.ops.slice(this.rev))
            }
            this.rev = this.ds.ops.length;
        }
    }
}
interface ServiceApi {
    open(path: string, mp: MessagePort):void
}

class PeerServer implements Service {
    ds = new Map<string,Doc>();

    open(path: string, mp: MessagePort) {
        let doc = this.ds.get(path)
        if (!doc) {
            doc = new Doc()
            this.ds.set(path, doc)
        }
        const w =  new WorkerChannel(mp) 
        const c = new Cl(lensApi(w))      
        doc.cl.add(c)
        const r: LensApi = {
            update: (ops: Op[]) => {
                doc?.update(c.peer, ops)
            }
        }
        apiListen(w, r)
    }
    // one per tab
    connect(ch: Channel) : ServiceApi{
        const r : ServiceApi = {
            open:  (path: string, mp: MessagePort) => {
                this.open(path, mp)
            }
        }
        return r
    }   
    disconnect(ch: Channel): void {
    }
}

createSharedListener(new PeerServer())