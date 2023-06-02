import { createResource, createSignal } from 'solid-js'
import { createSharedWorker, createWorker } from '../worker/useworker'
import { Db, callbackApi } from './db'

export * from './db'
export * from './v2/cell'
export * from './chat'
export * from './range'

// @ts-ignore
import Shared from './shared?sharedworker'
// @ts-ignore
import Worker from './worker?worker'

export const [db] = createResource<Db>(createDatabase)

// each tab for itself, for testing
export async function createDatabase(): Promise<Db> {
    const worker = await createWorker(new Worker, callbackApi)
    const db = new Db(worker)
    return db
}
// each tab connects to the shared worker.
// if it becomes the leader it creates a worker on behalf of the shared worker
// (the sharedworker can't create workers, so we need to do it on behalf of the shared worker)
export async function createDatabase2(): Promise<Db> {
    const sharedWorker = await createSharedWorker(new Shared, callbackApi)
    // create a database client around the shared worker
    const db = new Db(sharedWorker)
    // we might need to initiaize something here, currently unused wrapper
    return db
}
