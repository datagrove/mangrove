import { Setter } from "solid-js"
import { JsonPatch } from "../lexical/sync"
import { ApiSet, Channel, Peer } from "./rpc"


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
export interface LocalStateClient extends ApiSet{
    read(path: string, start: number, end: number) : Promise<Uint8Array>
    stat(path: string) : Promise<Stat>
    subscribe(path: string, from: number) : Promise<number>
    publish(handle: number, patch: any) : Promise<void>,
    close(handle: number): Promise<void>
}
export function LocalStateClientApi(mc: Channel) {
    return apiSet<LocalStateClient>(mc,"becomeLeader", "update") 
}


export class KeeperClient extends Peer {

    async read(path: string, start: number, end: number) : Promise<any[]> {
        return await this.rpc( "read", [start,end]) as any[]

    }
}

export class KeeperOwner extends Peer {

    write(id: string, a: any) {
        this.rpc("write", [id,a])
    }
}

export class HostClient extends Peer {
    
}


