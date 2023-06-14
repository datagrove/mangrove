
import { Channel, Service, WorkerChannel, apiCall, apiListen } from '../abc/rpc';
import { createSharedListener } from '../abc/shared';

import { LensApi, Op, DgElement, lensApi, LensServerApi, DgRangeSelection, ServiceApi, DgDoc } from './mvr_shared';

import { sample } from './mvr_test'

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
    _el : DgElement = {
        id: '',
        v: 0,
        conflict: '',
        tagName: '',
        class: '',
        children: []
    }
 }
export class DocState {
  _doc = new Map<string, Mvr >()

  import(lex: any) {
    for (let [k, v] of Object.entries(lex)) {
      const e = new Mvr()
      e._el = v
      this._doc.set(k, e)
    }
  }

  toJson() {
    const r: DgDoc = {}
    for (let [k, v] of this._doc) {
      r[k] = v._el
    }
    return r
  }
  merge_remote(op: Rop[]){
    for (let o of op) {
      let e = this._doc.get(o.id)
      if (!e) {
        e = new Mvr()
        this._doc.set(o.id,e)
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
        this._doc.delete(o.id)
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

class BufferState implements LensServerApi {
    api: LensApi
    constructor(public ps: PeerServer, mp: MessagePort){
        const w =  new WorkerChannel(mp) 
        this.api  = lensApi(w)
        apiListen<LensServerApi>(w, this)
    }
    update (ops: (string | DgElement)[], sel: DgRangeSelection): void {
        throw new Error('Function not implemented.');
    }
    subscribe (): void {
        throw new Error('Function not implemented.');
    }
    close (): void {
        throw new Error('Function not implemented.');
    }
}



class PeerServer implements Service {
    ds = new Map<string,DocState>();

    // one per tab
    connect(ch: Channel) : ServiceApi{
        const r : ServiceApi = {
            open:  async (mp: MessagePort, path: string): Promise<DgDoc> =>{
                let doc = this.ds.get(path)
                if (!doc) {
                    doc = new DocState()
                    this.ds.set(path, doc)
                }
                new BufferState(this, mp)    
                return doc.toJson()           
            },
        }
        return r
    }   
    disconnect(ch: Channel): void {
        // not used, workers don't have disconnect (sockets do, thus the api)
    }
}

createSharedListener(new PeerServer())


