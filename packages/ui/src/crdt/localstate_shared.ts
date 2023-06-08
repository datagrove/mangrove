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

// subscription here is a site, not a tuple.
// 

// LocalStateClient used by the tab
export interface LocalStateClient extends ApiSet{
    read(path: string, start: number, end: number) : Promise<Uint8Array|Err>
    open(path: string) : Promise<Stat|Err>
    subscribe(handle: number, from: number) : Promise<number|Err>
    publish(handle: number, patch: Uint8Array) : Promise<undefined|Err>,
    close(handle: number): Promise<void>
    write(handle: number, a: Uint8Array) : Promise<number|Err>
}
export function LocalStateClientApi(mc: Channel) {
    return apiSet<LocalStateClient>(mc,"read","open","subscribe","publish","close","write")
}


// the keeper client can be locally hosted, and use R2
// a keeper server can aggressively shed data to R2, and respond "r2"
export interface KeeperClient extends ApiSet {
   read(site: number, start: number, end: number) : Promise<Uint8Array[]|Err> 
   // clients can write directly to their own log by first getting a permission from the host. this is complex though? r2 does allow files to be appended, so it must be chunked, and tail file must be replaced
   write(path: string, a: any): Promise<Err>
   append(site: number, a: Uint8Array) : Promise<Err>
}
export function KeeperClientApi(mc: Channel) {
    return apiSet<LocalStateFromHost>(mc, "read", "write") 
}

// add authorization apis etc.
export interface HostClient extends ApiSet {
    // we can't query this (like localstate), because it can't decrypt the data.
    // we don't read it because go straight to the keeper for that.
    // publish here is sequencing of device.log pairs.
    // subscribe and handled by writing into a table shared with the host.
    // publishes are less likely to be batches, but might as well

    // logs are (site, device, length) tuples.
    // we can be a little tricky in rewriting the tail to get better compression but probably not worth it in real time 
    // separate arrays here to allow better compression
    create(path: string) : Promise<number|Err>,
    publish(site: number[], length: number[]) : Promise<undefined|Err>,
    authorize(site: number, length: number) : Promise<string[]|Err>,
}
export function HostClientApi(mc: Channel) {
    return apiSet<LocalStateFromHost>(mc, "publish", "authorize") 
}


export interface LocalStateFromHost extends ApiSet {
    // vbyte encode this? cbor gives us free compression, but vbyte probably better 2.0
    update(site: number[], length: number[]) : Promise<void>
}
export function LocalStateFromHostApi(mc: Channel) {
    return apiSet<LocalStateFromHost>(mc, "update") 
}

