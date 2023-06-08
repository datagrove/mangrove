import { Setter } from "solid-js"
import { JsonPatch } from "../lexical/sync"
import { ApiSet } from "./rpc"

// this is used from worker and implemented by the tab
export interface TabStateClient extends ApiSet  {
   becomeLeader() : Promise<boolean>
}

export interface LocalStateClient {
    subscribe(path: string,onchange: ()=>void) : Promise<{
        handle: number,
        doc: any
    }>
    publish(handle: number, patch: JsonPatch) : JsonPatch,

}

interface Api<P,R=void,Sigset={}> {
    sigset: Sigset
    params: P
    reply(r: R): void
    error(code: number, message: string): void
}

// can we subscribe to the leader? we need a way to transfer objects.
export type Subscribe = Api<
    {path: string}, 
    {handle: number, doc: any}, 
    {onchange: ()=>void}>

export type Publish = Api<
    {handle: number, patch: JsonPatch},
    JsonPatch>

