// all tabs share a single worker that is elected. sharedworker cannot use opfs
// no exports from here!

// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { decode, encode } from 'cbor-x';
// import { ScanQuery, ScanQueryCache, TableUpdate,  binarySearch } from './data';
import { IntervalTree } from './itree';
import { update } from '../lib/db';
import IndexWorker from './worker_index?worker'
import { Peer } from '../abc/rpc';
import { ScanQuery, Tuple } from './mvr_shared';
const ctx = self as any;

// global, each worker has a single database

// when we start a worker we should give a message channel that allows it to access the main console log? un


// servers can require drivers to support their storage
// servers. When contacting the host, the driver can be negotiated; the host can offer more than one driver.
export interface ServerDriver {
    // read is not generally authorized, as the data is already encrypted. There are few threat models where this would be useful
    readPage( id: string, credential: Uint8Array|null): Promise<Uint8Array>

    // writes generally need to be authorized because they must share a bucket in popular cloud services.
    writePage( id: string, credential: Uint8Array|null,  data: Uint8Array): Promise<string>

    authorize?: (id: string, credential: Uint8Array) => Promise<Uint8Array|null>

   
}

export class TestServerClient implements ServerDriver{
    data = new Map<string, Uint8Array>()
    async readPage(id: string, credential: Uint8Array | null): Promise<Uint8Array> {
        return this.data.get(id)!
    }
    async writePage(id: string, credential: Uint8Array | null, data: Uint8Array): Promise<string> {
        this.data.set(id, data)
        return ""
    }

    static async create(config: any) : Promise<Peer> {
        throw new Error("not implemented")
    }
}

type DriverMap = {
    [key: string]:  (config: any)=>Promise<Peer>
}


// this can return a peer that implements the ServerDriver interface.
export const drivers : {}= {
    "test":  (config: any)=>TestServerClient.create( config)
}

export interface PinnedTuple {
    server: Tuple
    editor: Tuple
}



// I can rate limit this; send no more than 10fps. combine the diffs
// function updateSubscription(subs: Set<Subscription>)  {
//     for (const sub of subs) {
//         const diff = computeDiff(sub.lastSent, sub.cache)
//         sub.lastSent = applyDiff(sub.lastSent, diff)
//         sub.ctx.write({
//             method: 'update',
//             params: {
//                 query: sub.query.handle,
//                 diff
//             }
//         })
//     }
// }


// subscriptions are going to be tied to message port.
export class Subscription {
    query: ScanQuery<any, any>
    cache: Keyed[]
    lastSent: Keyed[] // use this for diff,
  

    api: RangeSubscriber


// we need to run our updates through the interval tree to notify the subscribers
// we could shuffle off the work to a worker of creating the crdt merges?
// we know that these tuples are loaded in the subscription
 execOps(tbl: IntervalTree<Subscription>, table: string, upd: TableUpdate, dirty: Set<Subscription>) {
    // to find the key in our cache we need to encode it
    const v: QuerySchema<any> = schema.view[table]
    const keystr = v.marshalKey(upd.tuple)

    // we need collect the subscriptions, update all at once.
    const sub: Subscription[] = tbl.stab(keystr)
    sub.forEach(s => dirty.add(s))


    switch (upd.op) {
        case 'insert':
            break;
        case 'delete':
            break;
        case 'update':
            break;
    }

    // update is read-modify-write
    const updateSql = (row: unknown) => {
        // we need to run the functors on this. how does crdt fit here
        // it may need to write a file, so we should probably give the functor
        // a context. it might be good to have a functor that can do the whole
        // update in sql.
        const updated = schema.functor[upd.op](row, upd.tuple)
        // we need to update the database
        const sql = v.marshalWrite1(updated)
        db.exec({
            sql: sql[0],
            bind: sql.slice(1),
        })
        return updated
    }

    if (sub.length === 0) {
        // we need to read the record from the database to do the merge
        const r = v.marshalRead1(upd.tuple)
        db.exec({
            sql: r[0],
            bind: r.slice(1),
            callback: (row: any) => {
                updateSql(row)
            }
        })
    } else {
        // find the key in the first matching subscription, it will be the same in all of the matching. here we don't need to do the read, we can just do the write.
        // update all of them
        const s = sub[0]
        const n = binarySearch(s.cache, keystr)
        if (n >= 0) {
            // found it, update and notify
            const upd = updateSql(s.cache[n])

            sub.forEach(s => {
                const n = binarySearch(s.cache, keystr)
                if (n >= 0) {
                    // 
                }
            })
        }
         
    }
    // store

    }
}



export class DgServer {
    constructor(){

    }




// these can't fail; they always just apply the delta from the server and advance the universal version number. If the tuple has been pinned then we let the editors that pinned it known and send them the delta or new value. which one is specified in the pin command.
 async  syncFromServer(tx: Tx ) {
    
}

let _next = 0
export async function getIds(n: number) : Promise<number[]> {

    // get these from the server though.
    let a = new Array<number>(n)
    for (let i=0; i<n; i++)
        a[0] = _next++
    return a
}

// we need to read a list of servers that need syncup
async  reconcile(te: Server, db: Db, ) {
    
    let pr : Promise<any>[] = []
    let servers: string[] =[]

    for (let s of servers) {

        //syncUp(te, s, site)
    }
    await Promise.all(pr)
}


async  synchUp(te: Server,  server: string, site: string) {
    // if we have new local nodes, we first get a global  id for them
    // get a list of dirty tuples for this server. If any new insertions, get ids for them.

    const tx = db.begin("","")
    "select lsn, tx  from unsynched"
    // decode, get the inserts, modify them into updates against new allocated gid.
    "update {table} set gid=? where id=?"
    "update dirty set gid=? where id=?"
    tx.commit()


    // we can send a windo, but transactions after a failed transactions are ignored. it seems somewhat easier to reason about
    // if we only apply the transactions in order.
    for (let i=0; i<10; i++) {
        const [ok,siteVersion] = await siteCommit()
        if (!ok) {
            // a failure may advance our version of the site.
            // before starting again we need to wait until reconcile down 
            // maybe update a record here noting we are blocked until down synced?
            "update site set lastKnownVersion=? where site=?"
            return

        }
    }
    

    // 
    "delete from local where id = ?"

} 


}