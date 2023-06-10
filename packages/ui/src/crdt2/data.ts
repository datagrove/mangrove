import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel, Service, WorkerChannel, apiSet } from "../abc/rpc"
import { JsonPatch } from "../lexical/sync"
import { number } from "zod"

export interface ListenerApi {
    update(key: string, version: number, length: number): void
}

export interface GlobalApi {
    // these are not exactly what we are looking for, instead we should only listen to the database, and the database should be able to tell us when a key changes.
    // site 0 can the shared subscription database. This database will change whenever a site that the user subscribes to changes.
    commit(site: number, lock: number[], data: Uint8Array): Promise<boolean>
}
export function globalApi(ch: Channel): GlobalApi {
    return apiSet(ch, "write", "read")
}

export 
interface Op {
    type: "insert" | "tag" | "remove"
    pos: number
    length: number
    text: string
}

export type VersionSignal = (n: number) => void

export interface DocClientApi {
    propose(op: Op[], version: number): Promise<boolean>

    // update should be ignored if there have been intervening changes to editor (including selection); instead, call update again with the new changes. there is a select for each update though.
    // maybe we should patch the position map and let the editor do its own selection if it accepts the updates.
    updated(buffer: number, op: JsonPatch[],version: number[]): Promise<void>
}
export interface DocApi {
    globalUpdate(op: Op[], version: number): Promise<void>
    // buffer is painful but neither lexical or prosemirror support sharing two views of the same document.
    // as such each can be on a sligly different version.
    update(buffer: number, op: JsonPatch[],sel: EditorSelection): Promise<void> //Promise<[JsonPatch[],Selection]>
}

export function listenerApi(ch: Channel): ListenerApi {
    return apiSet(ch, "update")
}


export type Err = string
export interface LocalStateApi {
    open(key: string): Promise<undefined | Err>
    close(key: string): Promise<void>
    read(key: string, start: number): Promise<Op[]>
}
export function localStateApi(ch: Channel): LocalStateApi {
    return apiSet(ch, "open", "close", "read")
}

export interface EditorSelection {
    start: number
    end: number
}