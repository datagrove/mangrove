import { createSharedWorker } from '../worker/useworker'
import { Db, callbackApi } from './db'

export * from './db'
export * from './v2/cell'

// @ts-ignore
import Shared from './shared?sharedworker'


// each tab connects to the shared worker.
// if it becomes the leader it creates a worker on behalf of the shared worker
// (the sharedworker can't create workers, so we need to do it on behalf of the shared worker)
export async function createDatabase(): Promise<Db> {
    const sharedWorker = await createSharedWorker(new Shared, callbackApi)
    // create a database client around the shared worker
    const db = new Db(sharedWorker)
    // we might need to initiaize something here, currently unused wrapper
    return db
}
