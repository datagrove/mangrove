// all tabs share a single worker that is elected. sharedworker cannot use opfs
// no exports from here!

// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { decode, encode } from 'cbor-x';
// import { ScanQuery, ScanQueryCache, TableUpdate,  binarySearch } from './data';
import { IntervalTree } from './itree';
import { update } from '../lib/db';
import IndexWorker from './worker_index?worker'
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
// class TabState {
//     constructor(public write: any) { }
//     cache = new Map<number, Subscription>()
// }



// class TupleEditor {
//     // we might local numbers are negative.
//     pinned: Map<number, PinnedTuple> = new Map() 
//     site: Map<string, Map<string, 

// }
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






function close(ts: TabState, h: number) {
    // delete the record from the tabstate, we keep this list for cleanup when tab disconnects, it may be unnecessary? unclear if tab will be allowed to notify and send us this list.
    const sub = ts.cache.get(h)
    if (!sub) return
    ts.cache.delete(h)

    const tr = getTable(sub.query.server, sub.query.site, sub.query.table)
    if (tr)
        tr.remove(sub.query.from_, sub.query.to_, sub)
}

function disconnect(ts: TabState) {
    // close all subscriptions
    for (const s of ts.cache.keys()) {
        close(ts, s)
    }
}

// we could shuffle off the work to a worker of creating the crdt merges?
// we know that these tuples are loaded in the subscription
function execOps(tbl: IntervalTree<Subscription>, table: string, upd: TableUpdate, dirty: Set<Subscription>) {
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
// maybe a shared array buffer would be cheaper? every tab could process in parallel their own ranges
// unlikely; one tree should save power.
// we optimistically execute the query locally, and multicast the results to listeners
// server can proceed at its own pase.
function commit(ts: TabState, tx: Tx) {
    // insert tx into our 
    const svr = sv(tx.server)
    if (!svr) return

    // how do we rebase if we fail?
    log("commit", tx)
    db.exec("insert into log(server, entry) values (?,?)",
        [tx.server, encode(tx)])


    // stab with all the keys, then broadcast all the updated ranges.
    const site = svr.site[tx.site]
    if (!site) {
        error("site not found", tx.site)
        return
    }

    const dirty = new Set<Subscription>()
    for (const [table, upd] of Object.entries(tx.table)) {
        const tbl = site[table]
        if (!tbl) continue
        upd.forEach((x: TableUpdate) => {
            execOps(tbl.pinned, table, x, dirty)
        })
    }
    
}
// should we smuggle the source into the worker in order to pack keys?
// can they all be packed prior to sending?
function updateScan(ts: TabState, q: ScanQuery<any, any>) {
    const x = ts.cache.get(q.handle)
    const tbl = getTable(q.server, q.site, q.table)
}

function scan(ts: TabState, q: ScanQuery<any, any>) {
    const s = sv(q.server)

    // we need a way to compute a binary key
    const value: any[] = []
    db.exec({
        sql: q.sql,
        rowMode: 'array', // 'array' (default), 'object', or 'stmt'
        callback: function (row: any) {
            value.push(row);
        }.bind({ counter: 0 }),
    });

    const key = value.map(x => "")

    const sub: Subscription = {
        ctx: ts,
        query: q,
        cache:  value,
        lastSent: []
    }
    const tbl = getTable(q.server, q.site, q.table)
    tbl.add(q.from_, q.to_, sub)
}


// maybe move authorization code to https? we need https to deliver app anyway
// sockets could be to a different server
function syncdown(s: Server, b: any) {
    // this could be compressed vector os site and gsn
    const r = b as [string[], number[]]
    // we don't need to store the available gsn because we will get it each time we connect to the server

}
// call syncup 10x a second 
// call settimeout to retry the websocket connection if it fails
function syncService() {
    return;

    interface SyncState {
        lastRead: number[] // pairs of numbers
    }
    "insert into lastwrite(server, site, lsn) values (?,?,?)"
    // function sync(svr: Server, tx: SyncBatchDown[]) {
    //     "update lastread set gsn = ? where server = ? and site = ?"
    // }


    for (const [k, v] of server) {
        const svr = sv(k)
        if (!svr || !svr.isConnected) continue

        // const a = encode({
        //     method: 'syncup',
        //     params: {
        //         site: k,
        //         gsn: st.lsn,
        //         source: 0,
        //         lsn: s.lsn,
        //         tx: v
        //     }
        // })
        //svr.ws?.send(a)

    }


    setTimeout(() => syncService(), 100)
}
syncService()


async function start() {
    // the first client to connect initializes the database
    // create an index worker 


    let sqlite3 = await sqlite3InitModule({
        print: log,
        printErr: log,
    })
    try {
        log('Running SQLite3 version', sqlite3.version.libVersion);
        if ('opfs' in sqlite3) {
            db = new sqlite3.oo1.OpfsDb('/mydb.sqlite3');
            log('OPFS is available, created persisted database at', db.filename);
        } else {
            db = new sqlite3.oo1.DB('/mydb.sqlite3', 'ct');
            log('OPFS is not available, created transient database', db.filename);
        }

        // we need to benchmark sql that allows us to edit tuples with large blobs cheaply
        // one approach is to have the crdt value reach a fixed limit, then it writes a base to disk and keeps putting tail changes into the tuple.

        const search = (match: string) => `SELECT highlight(doc, 2, '<b>', '</b>') FROM doc(${match})`

        log('Creating tables...');
        schema.create.forEach(x => db.exec(x))
        log('Created tables');
    } catch (err: any) {
        error(err.name, err.message)
    }

    // this has a ways to go, we want a way that we can wire up a MessageChannel from any tab to the database worker in the leader.
    const connect = (read: any, write: any) => {
        const lc = new TabState(write)

        log("%c db started", "color: green")


        read.onmessage = (e: any) => {
            const { method, id, params } = e.data as {
                method: string
                id: number
                params: any
            }
            log('rpc', e.data )
            let sx: Server | undefined
            switch (method) {
                case 'disconnect':
                    disconnect(lc)
                    break
                case 'query':
                    db.exec({
                        sql: params.sql,
                        bind: params.bind,
                        rowMode: 'array', // 'array' (default), 'object', or 'stmt'
                        callback: function (row: any) {
                            write.postMessage({ id: id, result: row })
                        }.bind({ counter: 0 }),
                    });
                    break;
                case 'commit':
                    commit(lc, params)
                    break
                case 'scan':
                    scan(lc, params)
                    break
                case 'updateScan':
                    updateScan(lc, params)
                    break;
                case 'close':
                    close(lc, params.handle)
                    break
                default:
                    ctx.postMessage({ id: id, error: `no method ${method}` })
            }
        }
    }
    connect(ctx, ctx)
}
start()





// A tuple can contain atomic values or it can have structured values
// We can have a shadow copy of the canonical tuple we last saw from the host
// We can have an in-memory copy of the tuple we last handed to the editor

// in background we can create a provence index that shows the history of the tuple changes. not on the fast path.

import { Db, Tx } from "."
import { Peer } from '../abc/rpc';
import { AnyRecord } from 'dns';
import { ScanQuery, Subscription } from './mvr_shared';

// this is all accessed from the worker thread
interface Structured {
    attribute: { [key: string]: string }
    children: Structured[]
}
interface Tuple {
    _id: number,  // globally or universally unique id. universal is obtained  from the host
    _uid: number, // universal id.
    _table: string,
    [key: string]: number | string | Structured
}

// a pinned tuple has been given to the editor, keep it in memory until the editor closes it.
// tuples can be server ahead, server behind, both, or neither.
// we don't update a tuple unless it has been pinned. 
// if we get an update to 

// before we sync any tuple to the host, we first get a uuid from the host the uuid is used when syncing with the host.




// these can't fail; they apply the delta from the editor and advance the local version number.
function syncFromEditor(tuple: Tuple) {


}


// these can't fail; they always just apply the delta from the server and advance the universal version number. If the tuple has been pinned then we let the editors that pinned it known and send them the delta or new value. which one is specified in the pin command.
export async function syncFromServer(tx: Tx ) {
    
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
async function reconcile(te: Server, db: Db, ) {
    
    let pr : Promise<any>[] = []
    let servers: string[] =[]

    for (let s of servers) {

        //syncUp(te, s, site)
    }
    await Promise.all(pr)
}

// some transactions should be mergeable, but maybe not all. merging transactions that have different key sets can backfire, since some tx may fail that wouldn't otherwise. only merge consecutive updates to the same key (typing)
// the 
async function siteCommit(){
    return [true, 100]
}
async function syncDown(te: Server ) {

}
async function synchUp(te: Server,  server: string, site: string) {
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


/*
        for (let i = 20; i <= 25; ++i) {
            db.exec({
                sql: 'INSERT INTO t(a,b) VALUES (?,?)',
                bind: [i, i * 2],
            });
        }
        log('Query data with exec()...');
        db.exec({
            sql: 'SELECT a FROM t ORDER BY a LIMIT 3',
            callback: (row: any) => {
                log(row);
            },
        });
*/


