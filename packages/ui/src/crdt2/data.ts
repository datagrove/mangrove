import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel, Service, WorkerChannel, apiCall } from "../abc/rpc"
import { JsonPatch } from "../lexical/sync"
import { number } from "zod"

export interface ListenerApi {
    update(key: string, version: number, length: number): void
}

export type ValueRef = [string,string,string]  // table string, key, attribute
export type Uref = [string, number, string, string, string]

export interface GlobalApi {
    // these are not exactly what we are looking for, instead we should only listen to the database, and the database should be able to tell us when a key changes.
    // site 0 can the shared subscription database. This database will change whenever a site that the user subscribes to changes.
    commit(site: number, lock: number[], data: Uint8Array): Promise<boolean>
}
export function globalApi(ch: Channel): GlobalApi {
    return apiCall(ch, "write", "read")
}


type Insert = { type: "insert", start: number, text: string }
type Tag = { type: "tag", start: number, attr: object, end: number }
type Remove = { type: "remove", start: number, end: number }
export type Op = Insert | Tag | Remove

export type VersionSignal = (n: number) => void

export interface DocClientApi {
    propose(op: Op[], version: number): Promise<boolean>

    // update should be ignored if there have been intervening changes to editor (including selection); instead, call update again with the new changes. there is a select for each update though.
    // maybe we should patch the position map and let the editor do its own selection if it accepts the updates.
    updated(buffer: number, op: JsonPatch[],version: number[]): Promise<void>
}
export interface DocApi {
    globalUpdate(op: Op[], sessionid: number, version: number): Promise<void>
    // buffer is painful but neither lexical or prosemirror support sharing two views of the same document.
    // as such each can be on a sligly different version.
    update(buffer: Channel, op: JsonPatch[]): Promise<void> //Promise<[JsonPatch[],Selection]>
}

export function listenerApi(ch: Channel): ListenerApi {
    return apiCall(ch, "update")
}


export type Err = string
export interface LocalStateApi {
    open(path: string): Promise<number | Err>
    close(path: string): Promise<void> // reference count?
    // value is return by read; this seems more resilient
    propose(path: string, op: Op[], version: number, sessionId: number): Promise<void>
    read(path: string, start: number): Promise<Op[]>
}
export function localStateApi(ch: Channel): LocalStateApi {
    return apiCall(ch, "open", "close", "read")
}

export interface EditorSelection {
    begin: number
    end: number
}

export interface KeeperApi {
    read(file: string, start: number, end: number): Promise<Uint8Array>
}

export interface LexDiff {
    gid: string
    version: number // don't do anything if this is not the current version; +1 the version if successful

    value: JsonPatch  // update to get to newest version of the node.
}