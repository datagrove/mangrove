import { Channel, apiCall } from "../abc/rpc"
import { class } from '../lib/dx';


// shared state.




// we have to do something unusual to send a MessagePort?
export interface ServiceApi {
    connect(ch: MessagePort,key: string ): Promise<OmStateJson>
}
export function serviceApi(ch: Channel): ServiceApi {
    return apiCall(ch, "connect")
}

// receive updates to a sequence
export interface LensApi {
    update(ops: Op[]): void
    close(): void
}
export function lensApi(ch: Channel): LensApi {
    return apiCall(ch, "update")
}

interface Upd {
  op: "upd"  
  v: SimpleElement
}
interface Del {
  op: "del"
  id: string
}

type Op = Upd | Del

type Rop = {
  pk: string
  id: string
  dv: number  // device
  rm: number[] // pairs of numbers.
  rv: number[]
  v?: SimpleElement
}

interface SimpleElement {
  id: string
  v: number // increment each time
  conflict: string
  tagName: string
  class: string
  children: string[]
  [key: string]: any
}
type SimpleDoc = { [key: string] : SimpleElement }


export class DocBuffer implements LensApi {

  update(ops: Op[]): void {
    for (let o of ops) {
      if (o.op === "upd") {
        this.id[o.v.id] = o.v
      } else {
        delete this.id[o.id]
      }
    }
  }
  close(): void {
   
  }
  id: SimpleDoc = {}

}
 
interface MvrProposal {
  tagName: string
  children: string[]  // swizzle to _children: MvrProposal[]?
  [key: string]: any
}
class Mvr {
   _proposal = new Map<number, MvrProposal>()
}
export interface Mvrdoc {
  [key: string]: Mvr
}
// locally it's just lww, no merging. buffers send exact ops to the shared worker, the shared worker sends back the SimpleElement
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