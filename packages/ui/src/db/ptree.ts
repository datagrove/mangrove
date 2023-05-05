import { openDB } from "idb"
import { Service } from "./apix"

// we could opfs or indexeddb?
// should we use swizzling?

interface Page {
    diskloc: number 

}
// 3 types of pages: log 4k, disk 4k, disk 256k
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
async function read(id: number) {
    const tx = db.transaction("page", "readonly")
    const store = tx.objectStore("page")
    const page = await store.get(id)
    return page
}
async function write(id: number) {
    const tx = db.transaction("page", "readwrite")
    const store = tx.objectStore("page")
    await store.put(id)
    await tx.done
}
async function remove(id: number) {
    const tx = db.transaction("page", "readwrite")
    const store = tx.objectStore("page")
    await store.delete(id)
    await tx.done
}

// how can we have unlogged pages? an unlogged root?


// the key for idb will be have one bit for log and one bit for data.

class Store {
    

   buffer = new SharedArrayBuffer(1024 * 1024 * 1024)
   page = new Array<Page>()

   cool: Page[] = []

   unlogged: number = 0


   // active transactions.
   tx = new Map<number, Tx>()
   nextWatch = 0
   watch = new Map<number, Watch>()

   async write(loc: number, page: number) : Promise<void> {

   }

   async log(loc: number, page: number) : Promise<void> {

   }
   async trimLog(loc: number, page: number) : Promise<void> {


   }

   async read(from: Uint8Array, to: Uint8Array , limit: number, offset: number) {

   }

   // write all the blocks and 
   async checkpoint() {

   }

   async recover() {
    // the read the two roots and pick the newest one.
        let a = JSON.parse(await read(0))
        let b = JSON.parse(await read(1))
        let c = JSON.parse(await read(2))
   }
}
const st = new Store()

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
type Read = {
    tx: number
    from: Uint8Array
    to: Uint8Array
    limit: number
    offset: number
}

type Write = {
    tx: number
    dbptr: Uint8Array
    data: Uint8Array
}
type BulkWrite = {
    // we need columns for each key value, or probably 
    into: string[]
    key: Uint8Array
    col: Uint8Array[]
}


interface PageRef {

}

    interface Watch {

        from: Uint8Array
        to: Uint8Array
    }
// these can be optimistic, and allow the reader to pull what they need directly from the shared buffer, or we can copy directly into a temporary buffer that is charged to the transaction.
function addApi(s: Service) {
    s.set('connect', async (params: any) : Promise<number> =>{
        return 0
    })
    s.set('updateTx', async (params: Write):Promise<void> =>{
        st.tx.get(params.tx)?.update(params)
    })

    s.set('readTx', async (params: Read) : Promise<PageRef[]> =>{
        return st.tx.get(params.tx)?.read(params)??[]
    })


    s.set('commitTx', async (params: number) : Promise<void> =>{
        st.tx.get(params)?.commit()
    })

    // subscriptions act like an advisory lock; if the range has been updated then we send a notification

    s.set('watch', async (params: Watch):Promise<number> => {
        st.watch.set(++st.nextWatch, params)
        // more to do - contact server etc
        return st.nextWatch
    } )
    s.set('unwatch', async (params: number):Promise<void> =>{
        st.watch.delete(params)
    })
}