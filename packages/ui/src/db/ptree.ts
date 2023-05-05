import { openDB } from "idb"
import { Service, Watch } from "./data"

// we could opfs or indexeddb?
// should we use swizzling?

interface Page {
    diskloc: number

}


// how can we have unlogged pages? an unlogged root?


// the key for idb will be have one bit for log and one bit for data.

export class Store {
    constructor(public db: any) {
    }
    async dread(id: number) {
        const tx = this.db.transaction("page", "readonly")
        const store = tx.objectStore("page")
        const page = await store.get(id)
        return page
    }
    async dwrite(id: number) {
        const tx = this.db.transaction("page", "readwrite")
        const store = tx.objectStore("page")
        await store.put(id)
        await tx.done
    }
    async dremove(id: number) {
        const tx = this.db.transaction("page", "readwrite")
        const store = tx.objectStore("page")
        await store.delete(id)
        await tx.done
    }

    // 3 types of pages: log 4k, disk 4k, disk 256k
    static async open(s: string) {
        const db = await openDB("db", 1, {
            upgrade(db, oldVersion, newVersion, transaction, event) {
                db.createObjectStore("page")
            },
            blocked(currentVersion, blockedVersion, event) {
                // …
            },
            blocking(currentVersion, blockedVersion, event) {
                // …
            },
            terminated() {
                // …
            },
        })
        return new Store(db)
    }

    buffer = new SharedArrayBuffer(1024 * 1024 * 1024)
    page = new Array<Page>()

    cool: Page[] = []

    unlogged: number = 0


    // active transactions.
    tx = new Map<number, Tx>()
    nextWatch = 0
    nextTx = 0
    watch = new Map<number, Watch>()

    async begin() {
        const r = ++this.nextWatch
        this.tx.set(r, new Tx(this))
        return r
    }


    async write(loc: number, page: number): Promise<void> {

    }

    async log(loc: number, page: number): Promise<void> {

    }
    async trimLog(loc: number, page: number): Promise<void> {


    }

    async read(from: Uint8Array, to: Uint8Array, limit: number, offset: number) {

    }

    // write all the blocks and 
    async checkpoint() {

    }

    async recover() {
        // the read the two roots and pick the newest one.
        let a = JSON.parse(await this.dread(0))
        let b = JSON.parse(await this.dread(1))
        let c = JSON.parse(await this.dread(2))
    }
}


class Snapshot {

}


// each Tx needs to hold locks 
class Tx {
    constructor(public store: Store) {

    }
    update(p: Write) {

    }
    async read(r: Read) {
        return [] as PageRef[]
    }
    commit() {
        // 
    }
}

class Ptree {

}


// we need to process operations against a transaction that exists.
// not clear how we should return partial blocks. probably just transfer them as is?
// even with transfer we need to copy the block
// shared array buffer is best plan, lock the page and send the offset.
export type Read = {
    tx: number
    from: Uint8Array
    to: Uint8Array
    limit: number
    offset: number
}

export type Write = {
    tx: number
    dbptr: Uint8Array
    data: Uint8Array
}
export type BulkWrite = {
    // we need columns for each key value, or probably 
    into: string[]
    key: Uint8Array
    col: Uint8Array[]
}


export interface PageRef {

}
