// all tabs share a single worker that is elected. sharedworker cannot use opfs
// no exports from here!

// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { decode, encode } from 'cbor-x';
import { ScanQuery, ScanQueryCache, TableUpdate, Tx } from './data';
import { IntervalTree } from './itree';
import { update } from '../lib/db';
const ctx = self as any;

let db: any // sqlite3 database

// server|site 
const server = new Map<string, Server>()
const site_ = new Map<string, Site>()

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
    query: ScanQuery
    cache: ScanQueryCache
}
class TabState {
    constructor(public write: any) { }
    cache = new Map<number, Subscription>()
}

class Site {
    constructor(public lsn: number) { }
}


const rpcReply = (id: number, result: any) => {
    ctx.postMessage({
        id,
        result
    })
}
const rpcError = (id: number, error: any) => {
    ctx.postMessage({
        id,
        error
    })
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

const sv = (url: string) : Server => {
    let sx = server.get(url)
    if (!sx) {
        sx = new Server(url)
    }
    return sx
}


function getTable(server: string, site: string, table: string) : IntervalTree<Subscription> {
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
        tr.remove(sub.query.from, sub.query.to, sub)
}

function disconnect(ts: TabState) {
    // close all subscriptions
    for (const s of ts.cache.keys()) {
        close(ts, s)
    }
}

// we could shuffle off the work to a worker of creating the crdt merges?
// we know that these tuples are loaded in the subscription
function merge(sub: Subscription[], upd: TableUpdate ){

}
// maybe a shared array buffer would be cheaper? every tab could process in parallel their own ranges
// unlikely; one tree should save power.
// we optimistically execute the query locally, and multicast the results to listeners
// server can proceed at its own pase.
function commit(ts: TabState, tx: Tx) {
    // insert tx into our 
    const svr = sv(tx.server)
    if (!svr) return

    "insert into log(server, entry) values (?,?,?)"

    // stab with all the keys, then broadcast all the updated ranges.
    const site = svr.site[tx.site]
    if (!site) return

    for (const [table, upd] of Object.entries(tx.table)) {
        const tbl = site[table]
        if (!tbl) continue
        upd.forEach( (x:TableUpdate) => {
            x.key.forEach(k => {
                 merge(tbl.stab(k), x)
            })
        })
    }
}

function updateScan(ts: TabState, q: ScanQuery) {
    const x = ts.cache.get(q.handle)
    const tbl = getTable(q.server, q.site, q.table)
}

function scan(ts: TabState, q: ScanQuery) {
    const s = sv(q.server)

    // execte the query once. we can generate sql here to do it.
    let sql = `select * from ${q.table} where server=`

    // we need a way to compute a binary key
    const value : any[] = []
    db.exec({
        sql: sql,
        rowMode: 'array', // 'array' (default), 'object', or 'stmt'
        callback: function (row:any) {
          value.push(row);
        }.bind({ counter: 0 }),
      });

    const key = value.map( x => new Uint8Array(0))

    const sub : Subscription = {
        ctx: ts,
        query: q,
        cache: {
            anchor: q.offset??0,
            key: key,
            value: value
        }
    }
    const tbl = getTable(q.server, q.site, q.table)
    tbl.add(q.from, q.to, sub)
}


// maybe move authorization code to https? we need https to deliver app anyway
// sockets could be to a different server
function syncdown(s: Server, b: any ){
    // this could be compressed vector os site and gsn
    const r = b as [string[], number[]]
    // we don't need to store the available gsn because we will get it each time we connect to the server

}
// call syncup 10x a second 
// call settimeout to retry the websocket connection if it fails
function syncService() {
    return
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


    let sqlite3 = await sqlite3InitModule({
        print: log,
        printErr: log,
    })
    try {
        log('Running SQLite3 version', sqlite3.version.libVersion);
        let db: any;
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
        const sql = [
            "create table if not exists site(sid integer primary key, server, site, lastread, lastwrite)",
            "create table if not exists log(lsn integer primary key, entry)",
            "create table if not exists channel(id integer primary key, npath, path,content)",
            "create index if not exists channel_path on channel(npath, path)",
            "create table if not exists message(id integer primary key, partof, created,author, content)",
            "create index if not exists message_partof on message(partof,id)",
            "create table if not exists author(id integer primary key, name, email)",
            "create table if not exists attach(id integer primary key, partof,  type,  content)",
            "create index if not exists attach_partof on attach(partof)",
            "CREATE VIRTUAL TABLE if not exists doc USING fts5(docid, server, site, mime, tbl, key,extracted)",
            "create table if not exists facets(name, docid, primary key(name, docid))",
            "create index if not exists facets_docid on facets(docid)",
            // name is something like price
            "create table if not exists val(name, value,docid, primary key(name,value, docid))",
            "create index if not exists val_docid on val(docid)",
            "create table if not exists transclude(id integer primary key, partof, relatesTo, type, content)",
            "create index if not exists transclude_partof on transclude(partof)",
            "create index if not exists transclude_relatesTo on transclude(relatesTo)",
        ]
        log('Creating tables...');
        sql.forEach(x => db.exec(x))
        log('Created tables');
    } catch (err: any) {
        error(err.name, err.message)
    }

    const connect = (read: any, write: any) => {
        const lc = new TabState(write)

        log("%c db started", "color: green")


        read.onmessage = (e: any) => {
            const { method, id, params } = e.data as {
                method: string
                id: number
                params: any
            }
            let sx: Server | undefined
            switch (method) {
                case 'disconnect':
                    disconnect(lc)
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


