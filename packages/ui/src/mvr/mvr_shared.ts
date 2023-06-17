import { LexicalNode, SerializedLexicalNode } from "lexical"
import { Channel, Peer, apiCall } from "../abc/rpc"
import { createSign } from "crypto"
import { createSignal } from "solid-js"
import { Tx } from "../dblite"

// [ host, site, table, rowid, columnid]
// we can use queries to return a tuple pointer. we can use the tuple pointer to initiate an editor

export type ValuePointer = [number,number,number,number,number]

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
    open(url: ValuePointer,ch: MessagePort ): Promise<DgElement[]|string>
}
export function serviceApi(ch: Peer): ServiceApi {
    return apiCall(ch, "open")
}

//type LexSelection = null | RangeSelection | NodeSelection | GridSelection
// receive updates to a sequence


export interface Etx {
  id: number
  data: Uint8Array
  lock: number[]
  lockValue: number[]
}
export interface AuthApi {
  login(challenge: Uint8Array, user: string, response: Uint8Array): Promise<void>
}
export interface CommitApi {
  commit(tx: Etx): Promise<number>
}
// subscribe is a commit to the user database.

// tail updates are best effort and may not include the bytes when the lock server is under stress. it may not update every tail (based on load an capacity), but will prioritize according to subscription weight stored in the subscription database.
type TailUpdate = [number, Uint8Array]
export interface SubscriberApi {
  sync(length: number, tail: TailUpdate[]) : Promise<void>
}
export function subscriberApi(ch: Peer): SubscriberApi {
    return apiCall(ch, "sync")
}


export interface KeeperApi {
  read(id: number, at: number, size: number): Promise<Uint8Array|string>
}

export type KeyMap = [string, string][]

export interface LensApi {
  update(ins: DgElement[], upd: DgElement[], del: string[], selection: DgSelection) : Promise<KeyMap>
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

