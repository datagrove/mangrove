import { Setter } from "solid-js"
import { JsonPatch } from "../lexical/sync"
import { ApiSet, Channel, Peer } from "./rpc"
import { LocalState } from "./localstate"


// we create api's from channels
// build an rpc set from a list of rpc names
// eventually change this to code generation, or maybe typescript magic
export function apiSet<T>(mc: Channel, ...rpc: string[]): T {
    const peer = new Peer(mc)
    const o: any = {}
    rpc.forEach((e) => {
        o[e] = async (...arg: any[]): Promise<any> => {
            return await peer.rpc(e, arg)
        }
    })
    return o as T
}

// this is used from worker and implemented by the tab
export interface TabStateClient extends ApiSet  {
   becomeLeader() : Promise<boolean>
   update(handle: number, length: number) : Promise<void>
}

export function TabStateClientApi(mc: Channel)  {
    return apiSet<TabStateClient>(mc,"becomeLeader", "update") 
}

export interface Stat {
    writable: boolean  
    length: number
    // last good snapshot
    snapBegin: number
    snapEnd: number
}
export interface Snapshot {
    next: number // next snapshot.

    author: number
    begin: number
    end: number 
}
export type Err = string
// path here is referring to a cell location?
// we want to be able to overflow to a external dictionary of logs
// the log dictionary is written by individual devices, but tabs coordinate to use the same log
// when we query the table, we want to show a summary of, opening to full doc
export interface LocalStateClient extends ApiSet{
    read(path: string, start: number, end: number) : Promise<Uint8Array|Err>
    open(path: string) : Promise<Stat|Err>
    subscribe(handle: number, from: number) : Promise<number|Err>
    publish(handle: number, patch: Uint8Array) : Promise<Err>,
    close(handle: number): Promise<void>
    write(handle: number, a: Uint8Array) : Promise<number|Err>
}
export function LocalStateClientApi(mc: Channel) {
    return apiSet<LocalStateClient>(mc,"becomeLeader", "update") 
}


export interface KeeperClient extends ApiSet {
   read(path: string, start: number, end: number) : Promise<Uint8Array[]|Err> 
   // clients can write directly to their own log by first getting a permission from the host. this is complex though? r2 does allow files to be appended, so it must be chunked, and tail file must be replaced
   write(path: string, a: any): Promise<Err>
}

// add authorization apis etc.
export interface HostClient extends LocalStateClient {

}


