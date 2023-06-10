
import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel, Service, WorkerChannel, apiSet } from "../abc/rpc"
import { JsonPatch } from "../lexical/sync"
import { DocApi, ListenerApi, LocalStateApi, Op, VersionSignal, localStateApi } from "./data"
import { Doc } from "./doc_worker"
import { LocalState } from "./local"


class TabDoc {
    listen = new Set<VersionSignal>
    length = 0
    constructor(public api: DocApi){}
 }
 // tab state shares documents between buffers
 class TabState implements ListenerApi {
     ls!: LocalStateApi
     doc = new Map<string,TabDoc >()
     next = 0
 
     constructor(sharedWorker?: SharedWorker) {
         if (!sharedWorker) {
             const ls = new LocalState()
             const o = new MessageChannel()
             ls.connect(new WorkerChannel(o.port2))
             this.ls = localStateApi(new WorkerChannel(o.port1))
         } else {
 
         }
     }
     propose(op: Op[], version: number): Promise<boolean> {
         throw new Error("Method not implemented.")
     }
     updated(buffer: number, op: JsonPatch[], version: number[]): Promise<void> {
         throw new Error("Method not implemented.")
     }
 
     globalUpdate(op: Op[], version: number): Promise<void> {
         throw new Error("Method not implemented.")
     }
     transformed(key: string, buffer: number, op: JsonPatch[], sel: Selection): Promise<void> {
         throw new Error("Method not implemented.")
     }
     getDoc(key: string): TabDoc {
         let doc = this.doc.get(key)
         if (!doc) {
             const api : DocApi = new Doc()
             doc = new TabDoc(api)
             this.doc.set(key, doc)
         }
         return doc
     }
     connect(key: string, fn: () => void) {
         let doc = this.getDoc(key)
         doc.listen.add(fn)
 
     }
     disconnect(key: string, fn: VersionSignal) {
         const d  = this.getDoc(key) 
         d .listen.delete(fn)
     }
 
     // called by localstate
     async update(key: string, version: number, length: number): Promise<void> {
         const d = this.getDoc(key)
         const op = await this.ls.read(key, d.length)
         await d.api.globalUpdate(op,version)
         this.getDoc(key).listen.forEach(fn => fn(version))
         return
     }
 }
 export const TabContext = createContext<TabState>()
 export const useTab = () => useContext<TabState | undefined>(TabContext)
 