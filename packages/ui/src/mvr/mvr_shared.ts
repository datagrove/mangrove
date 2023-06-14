import { GridSelection, NodeSelection, RangeSelection } from "lexical"
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

export interface LensApi {
  update(op: Op[], selection: DgSelection) : [string, string][]
}
export function lensApi(ch: Channel): LensApi {
    return apiCall(ch, "update")
}
export interface LensServerApi {
  update(ops: (DgElement|string)[], sel: DgSelection): void
  subscribe(): void
  close(): void
}
export function lensServerApi(ch: Channel): LensServerApi {
  return apiCall(ch, "update", "close")
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




