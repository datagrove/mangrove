import { createResource, createSignal } from 'solid-js'
import { createSharedWorker, createWorker } from '../worker/useworker'
import { Db, callbackApi } from './db'

export * from './db'
export * from './v2/cell'
export * from './chat'
export * from './range'
export * from './data'

// @ts-ignore
import Shared from './shared?sharedworker'
// @ts-ignore
import Worker from './worker?worker'
import { RowSource, ScanQuery, ScanQueryCache } from './data'

export let db: Db = new Db(createWorker(new Worker, callbackApi))

// each tab for itself, for testing
// export async function createDatabase(): Promise<Db> {
//     const worker = await createWorker(new Worker, callbackApi)
//     db = new Db(worker)
//     return db
// }
// // each tab connects to the shared worker.
// // if it becomes the leader it creates a worker on behalf of the shared worker
// // (the sharedworker can't create workers, so we need to do it on behalf of the shared worker)
// export async function createDatabase2(): Promise<Db> {
//     const sharedWorker = await createSharedWorker(new Shared, callbackApi)
//     // create a database client around the shared worker
//     const db = new Db(sharedWorker)
//     // we might need to initiaize something here, currently unused wrapper
//     return db
// }

// maybe it would be better to have a promise that gets the next cache
// then we can use it in a loop. A generator?
export class RangeSource {
    cache: ScanQueryCache = {
        anchor: 0,
        key: [],
        value: []
    }
    
    constructor(q: ScanQuery) {
        // we have to send db thread a query
    }

    
    update(n: number) {
        // we have to send db thread an update query
    }

    async next() : Promise<ScanQueryCache>{
        // don't return until we have a new cache.
        return this.cache
    }

    close() {

    }
}

// this is for the main thread, it mostly communicates with the database thread
// can the listener be in the contstructor? 
export function createRangeSource(q: ScanQuery) : RangeSource {
    // assign q a random number? then we can broadcast the changes
    db.w.send({
        method: 'scan',
        params: q
    })
    return new RangeSource(q)
}