import { GridSelection, LexicalNode, NodeSelection, RangeSelection, SerializedLexicalNode } from "lexical"
import { Channel, apiCall } from "../abc/rpc"



// shared state.


export interface ServiceApi {
    open(ch: MessagePort,key: string ): Promise<DgDoc>
}
export function serviceApi(ch: Channel): ServiceApi {
    return apiCall(ch, "open")
}
//type LexSelection = null | RangeSelection | NodeSelection | GridSelection
// receive updates to a sequence

export type DgRangeSelection = {

}
export type DgSelection = DgRangeSelection

export type KeyMap = [string, string][]
export interface LensApi {
  update(op: Op[], selection: DgSelection) : Promise<KeyMap>
}
export function lensApi(ch: Channel): LensApi {
    return apiCall(ch, "update")
}
export interface LensServerApi {
  update(ops: (DgElement|string)[], sel: DgSelection): Promise<void>
  subscribe(key: KeyMap): Promise<void>
  close(): Promise<void>
}
export function lensServerApi(ch: Channel): LensServerApi {
  return apiCall(ch, "update", "subscribe","close")
}

interface Upd {
  op: "upd" | "ins"
  v: DgElement
}
interface Del {
  op: "del"
  id: string
}

export type Op = Upd | Del

export interface DgElement {
  id: string
  v: number // increment each time
  conflict: string
  tagName: string
  class: string
  parent?: string
  children: string[]
  [key: string]: any
}
export type DgDoc = { [key: string] : DgElement }



// give every node an id. 
let _next = 0
export function lexicalToDg(lex: any) : DgDoc {
  let dgd : DgDoc = {}

  const copy1 = (root: any) : string => {
    const key = `${_next++}`
      for (let [k, v] of Object.entries(lex)) {
        const a = v as any
        if (a.children) {
          for (k of a.children) {
            copy1(k)
          }
        }
      }
      return key
  }
  copy1(lex)
  return dgd
}