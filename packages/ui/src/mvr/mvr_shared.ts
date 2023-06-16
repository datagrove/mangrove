import { LexicalNode, SerializedLexicalNode } from "lexical"
import { Channel, Peer, apiCall } from "../abc/rpc"
import { createSign } from "crypto"
import { createSignal } from "solid-js"


export interface DgElement {
  id: string
  v: number // increment each time
  conflict: string
  type: string
  parent?: string
  children: string[]
}
// shared state.


export interface ServiceApi {
    open(key: string,ch: MessagePort ): Promise<DgElement[]>
}
export function serviceApi(ch: Peer): ServiceApi {
    return apiCall(ch, "open")
}
//type LexSelection = null | RangeSelection | NodeSelection | GridSelection
// receive updates to a sequence



export type KeyMap = [string, string][]

export interface LensApi {
  update(upd: DgElement[], del: string[], selection: DgSelection) : Promise<KeyMap>
}
export function lensApi(ch: Peer): LensApi {
    return apiCall(ch, "update")
}

export interface LensServerApi {
  update(upd: DgElement[], del: string[], sel: DgSelection): Promise<void>
  subscribe(key: KeyMap): Promise<void>
  close(): Promise<void>
}
export function lensServerApi(ch: Peer): LensServerApi {
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

export function topologicalSort(elements: DgElement[]): [DgElement[],{[id:string]:DgElement}] {
  console.log("elements", elements)
  const id: { [id: string]: DgElement } = {};
  const visited: { [id: string]: boolean } = {};
  const sorted: DgElement[] = [];

  for (const element of elements) {
      id[element.id] = element;
  }
  //console.log("idxx", elements.map(e => [e.id, ...e.children]))

  const visit = (element: DgElement) => {
      if (visited[element.id]) {
          return;
      }
      visited[element.id] = true;
      for (const childId of element.children) {
          const child = id[childId]
          if (child) {
              visit(child);
          } else {
              throw new Error(`child ${childId} not found`)
          }
      }
      // only push if all children have been visited.
      sorted.push(element);
  };

  for (const element of elements) {
      visit(element);
  }
  //console.log("sorted", sorted.map(e => [e.type+"."+e.id, ...e.children]))
  return [sorted,id];
}

interface RangeSelection {
  type: "range"
  start: string
  end: string
  startOffset: number
  endOffset: number
}
interface NodeSelection {
  type: "node"
  node: string
}
interface GridSelection {
  type: "grid"
  topLeft: string
  bottomRight: string
}

export type DgSelection = (RangeSelection | NodeSelection | GridSelection)[]

