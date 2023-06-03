

// facets: author, channel, reactions

import { Accessor, createSignal } from "solid-js"
import { ScanQuery, ScanQueryCache } from "./data"


// we need to get the last read location (shared among all one user's devices)
// usage could be good for other things like a set of things that are open and closed, favorite, etc.
interface Usage {
    lastRead: number
}
export async function getUsage(path: string) : Promise<Usage> {
    return {
        lastRead: 0
    }
}
export async function setUsage(path: string, usage: Usage) {

}


// we don't need a mutator here; the local database will return right away.
// offsets are not that helpful for chats, since we would need to compensate for deletes.
// so try to use lastRead as timestamp
// select * from chat where key > lastRead limit 1000
// we can update the

// instead of a signal for every row, we have a diff signal for the range.
// 

// when syncing the database will send an insert for the global version and a delete for the old version
export interface TableUpdate {
    type: 'replace' | 'delete'
    key: Uint8Array[]
    version: number
    value: Uint8Array[]  // in some cases this could be a delta too. we could invoke a blob then? maybe the (handle,length) of the bloglog changes to trigger.
}

// only one db?
export function listen(query: ScanQuery, setO: (o: TableUpdate[]) => void) {

}   
// there is some racing here, but it can be managed by the database thread
type UpdateScanQuery = (anchor: number) => void
export function closeListen(query: ScanQuery) {

}

export function watchRange(query: ScanQuery) : [Accessor<TableUpdate[]> ,UpdateScanQuery, () => void]{
    // should I diff here? a self mutating signal would be counter to normal practice
    // potentially once we are done with an effect, we could advance? not clearly better.
    const [o,setO] = createSignal<TableUpdate[]>([])
    listen(query,setO)
    return [o, (anchor: number) => {},()=>closeListen(query)]
}

export interface RowSource {
    setAnchor(n: number): void
    addListener(fn: (c: ScanQueryCache)=>void ): void
    close(): void
}

// this is for the main thread, it mostly communicates with the database thread
export function createRangeSource(q: ScanQuery) : RowSource {
    return {
        setAnchor(n: number) {
            
        },
        addListener(fn: (c: ScanQueryCache)=>void ) {
        },
        close() {
        }
    }
}

// we need a log to update the shared data; we read the log from cloud storage, then update the listeners

// each server assigns a 64 bit integer to each site.
// each client can assign a 64 bit integer to each server
