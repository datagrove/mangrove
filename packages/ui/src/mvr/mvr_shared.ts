import { Channel, apiCall } from "../abc/rpc"



// shared state.


// we have to do something unusual to send a MessagePort?
export interface ServiceApi {
    open(ch: MessagePort,key: string ): Promise<SimpleDoc>
    close(ch: MessagePort):void
}
export function serviceApi(ch: Channel): ServiceApi {
    return apiCall(ch, "open")
}

// receive updates to a sequence
export interface LensApi {
    update(ops: Op[]): void
}
export function lensApi(ch: Channel): LensApi {
    return apiCall(ch, "update")
}
export interface LensServerApi {
  update(ops: Op[]): void
  close(): void
}
export function lensServerApi(ch: Channel): LensServerApi {
  return apiCall(ch, "update", "close")
}

interface Upd {
  op: "upd" | "ins"
  v: SimpleElement
}
interface Del {
  op: "del"
  id: string
}

export type Op = Upd | Del



export interface SimpleElement {
  id: string
  v: number // increment each time
  conflict: string
  tagName: string
  class: string
  children: string[]
  [key: string]: any
}
export type SimpleDoc = { [key: string] : SimpleElement }




