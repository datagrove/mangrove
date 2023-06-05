// all tabs share a single worker that is elected. sharedworker cannot use opfs
// no exports from here!

// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { decode, encode } from 'cbor-x';
import { ScanQuery, ScanQueryCache, TableUpdate, Tx, binarySearch } from './data';
import { IntervalTree } from './itree';
import { update } from '../lib/db';
import { QuerySchema } from './schema';
import { schema } from './editor_schema'
import IndexWorker from './worker_index?worker'
const ctx = self as any;

// global, each worker has a single database

// when we start a worker we should give a message channel that allows it to access the main console log? un

let db: any // sqlite3 database

export function indexFiles( ){

}

export function reindex(){

    
}
// server|site 
const server = new Map<string, Server>()
// const site_ = new Map<string, Site>()
// class Site {
//     constructor(public lsn: number) { }
// }

// we can broadcast service status and range versions
const bc = new BroadcastChannel('server')
function bcSend() {
    bc.postMessage({
        server: [...server.keys()],
        up: [...server.values()].filter(x => x.isConnected).map(x => x.url)
    })
}

class Server {
    // there is an glsn per server, otherwise it would be hard for server to know if any are missing
    glsn = 0
    // we have a tree per table, this lets us cache/hash the top cheaply.
    site: {
        [site: string]: {
            [table: string]: IntervalTree<Subscription>
        }
    } = {}

    avail = new Map<string, number>()

    constructor(public url: string) {
        this.connect()
    }
    ws?: WebSocket
    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN
    }
    connect() {
        this.ws = new WebSocket(this.url)
        bcSend()
        this.ws.onmessage = (e) => {
            const a = decode(e.data) as {
                method: string
                id?: number
                params: any
            }
            switch (a.method) {
                case "s":
                    syncdown(this, a.params)
            }
        }
        this.ws.onerror = (e) => {
            this.ws = undefined
            setTimeout(() => this.connect(), 1000)
            bcSend()
        }
        this.ws.onclose = (e) => {
            this.ws = undefined
            setTimeout(() => this.connect(), 1000)
            bcSend()
        }
        this.ws.onopen = (e) => {
            bcSend()
        }
    }
}

interface Subscription {
    ctx: TabState
    query: ScanQuery<any, any>
    cache: Keyed[]
    lastSent: Keyed[] // use this for diff,
}
// I can rate limit this; send no more than 10fps. combine the diffs
function updateSubscription(subs: Set<Subscription>)  {
    for (const sub of subs) {
        const diff = computeDiff(sub.lastSent, sub.cache)
        sub.lastSent = applyDiff(sub.lastSent, diff)
        sub.ctx.write({
            method: 'update',
            params: {
                query: sub.query.handle,
                diff
            }
        })
    }
}

class TabState {
    constructor(public write: any) { }
    cache = new Map<number, Subscription>()
}


const log = (...args: any[]) => {
    ctx.postMessage({
        method: 'log',
        params: args
    })
}
const error = (...msg: string[]) => {
    log("%c", "color: red", ...msg)
}

const sv = (url: string): Server => {
    let sx = server.get(url)
    if (!sx) {
        sx = new Server(url)
    }
    return sx
}

function getTable(server: string, site: string, table: string): IntervalTree<Subscription> {
    let s = sv(server)
    let st = s.site[site]
    if (!st) {
        st = {}
        s.site[site] = st
    }
    let t = st[table]
    if (!t) {
        // we need to create the table
        t = new IntervalTree<Subscription>()
    }
    return t
}

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
            execOps(tbl, table, x, dirty)
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


