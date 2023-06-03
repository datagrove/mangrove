// all tabs share a single worker that is elected. sharedworker cannot use opfs
// no exports from here!

// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { encode } from 'cbor-x';
import { ScanQuery, ScanQueryCache, Tx } from './data';
import { IntervalTree } from './itree';
const ctx = self as any;

let db: any // sqlite3 database

// server|site 
const range = new Map<string, IntervalTree<Subscription>>()
const server = new Map<string, Server>()
const site_ = new Map<string, Site>()

class Server {
    // there is an glsn per server, otherwise it would be hard for server to know if any are missing
    glsn = 0
    constructor(public url: string) {
        this.connect()
    }
    ws?: WebSocket
    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN
    }
    connect() {
        this.ws = new WebSocket(this.url)
        this.ws.onmessage = (e) => {
        }
        this.ws.onerror = (e) => {
            setTimeout(() => this.connect(), 1000)
        }
        this.ws.onclose = (e) => {
        }
        this.ws.onopen = (e) => {
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
function getSite(server: string, site: string) {
    const s = site_.get(`${server}|${site}`)
    if (s) return s
    // really here we should restore the lsn from disk not start from 0
    const st = new Site(0)
    site_.set(`${server}|${site}`, st)
    return st
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

const sv = (url: string) => {
    let sx = server.get(url)
    if (!sx) {
        sx = new Server(url)
    }
    return sx
}


function close(ts: TabState, h: number) {
    const sub = ts.cache.get(h)
    if (!sub) return
    ts.cache.delete(h)
    const s = sv(sub.query.server ?? "")
    if (!s) return
    const tr = range.get(`${sub.query.server}|${sub.query.site}`)
    if (tr) {
        tr.remove(sub.query.from, sub.query.to, sub)
    }
}
function disconnect(ts: TabState) {
    // close all subscriptions
    for (const s of ts.cache.keys()) {
        close(ts, s)
    }
}

// we optimistically execute the query locally, and broadcast the results to listeners
// server can proceed at its own pase.
function commit(ts: TabState, tx: Tx) {
    // insert tx into our 
    const svr = sv(tx.server)
    if (!svr) return

    "insert into log(server, lsn, entry) values (?,?,?)"

   



    // different sites are queued separately since they need to be encrypted with different keys

    // writing to a local log is a way to do exactly once;
    // we can write these directly to opfs?


    "insert into lastwrite(server, site, lsn) values (?,?,?)"

}

function scan(ts: TabState, params: ScanQuery) {
    const s = sv(params.server)

}


// a tx is encrypted e2e
interface SyncBatchDown {
    ops: {
        site: number
        gsn: number
        source: number
        lsn: number
        tx: Uint8Array //  encypted blob of Tx[]
    }
}
// call syncup 10x a second 
// call settimeout to retry the websocket connection if it fails
function syncup() {
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


    setTimeout(() => syncup(), 100)
}


// associated with a socket connection



// we need to be able to roll back our local changes in order to keep them consistent with the global order
// we can keep the updates in a json field, then drop this field when it commits?





// there is a bit in the key that identifies a blob
// in this case the rest of the key is a blob handle
// the value is a bloblog

// spreadsheets do not need any special treatment over a database. They are strictly lww wins, with no special merging.

interface SyncState {
    lastRead: number[] // pairs of numbers
}

function sync(svr: Server, tx: SyncBatchDown[]) {
    "update lastread set gsn = ? where server = ? and site = ?"
}

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


