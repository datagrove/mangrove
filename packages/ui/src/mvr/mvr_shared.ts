import { GridSelection, LexicalNode, NodeSelection, RangeSelection, SerializedLexicalNode } from "lexical"
import { Channel, apiCall } from "../abc/rpc"


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
// shared state.


export interface ServiceApi {
    open(ch: MessagePort,key: string ): Promise<DgElement[]>
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
  update(upd: DgElement[], del: string[], selection: DgSelection|null) : Promise<KeyMap>
}
export function lensApi(ch: Channel): LensApi {
    return apiCall(ch, "update")
}
export interface LensServerApi {
  update(upd: DgElement[], del: string[], sel: DgSelection): Promise<void>
  subscribe(key: KeyMap): Promise<void>
  close(): Promise<void>
}
export function lensServerApi(ch: Channel): LensServerApi {
  return apiCall(ch, "update", "subscribe","close")
}

export interface Upd {
  op: "upd" | "ins"
  v: DgElement
}
export interface Del {
  op: "del"
  id: string
}
export type Op = Upd | Del


