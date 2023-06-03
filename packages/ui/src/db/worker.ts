// all tabs share a single worker that is elected. sharedworker cannot use opfs

// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { encode } from 'cbor-x';
import { ScanQuery, ScanQueryCache } from './data';
import { IntervalTree } from './itree';
const ctx = self as any;
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



// single threaded
// possibly restore a snapshot in one go here?
// a full sqlite file? a zip file?
// in some ways sqlite is closer to what we want?
// opens up search possibilities?

// most of the api's are defined here.
// 
// we can keep information about a client so we can back it out if they disconnect
// how can we clean up when a tab closes, especially if it is the leader?

// can we use the first client to initialize the database?
// then return log messages to that client?
let db: any // sqlite3 database

const server = new Map<string, Server>()
const sv = (url: string) => {
    let sx = server.get(url)
    if (!sx) {
        sx = new Server(url)
    }
    return sx
}
class TabState {
    constructor(public write: any) { }
    cache = new Map<number, Subscription>()
}


function close(ts: TabState, h: number) {
    const sub = this.cache.get(h)
    if (!sub) return
    ts.cache.delete(h)
    const s = sv(sub.query.server ?? "")
    if (!s) return
    range.remove(sub.query.from, sub.query.to, sub)
}
function disconnect() {
    // close all subscriptions
    for (const s of this.cache.keys()) {
        this.close(s)
    }
}
function commit(tx: Tx) {
    // insert tx into our 
    const s = sv(tx.server)
    if (!s) return
    // different sites are queued separately since they need to be encrypted with different keys

    tosend.get(tx.site)?.push(tx)
}
function scan(params: ScanQuery) {
    const s = sv(params.server)

}


interface Subscription {
    ctx: TabState
    query: ScanQuery
    cache: ScanQueryCache
}
class Site {
    constructor(public lsn: number) {

    }
}

const range = new Map<string, IntervalTree<Subscription>>()
const tosend = new Map<string, SyncBatchUp>()
function getSite(server: string, site: string) {
    return new Site(0)
}

function commit(tx: Tx) {
    // writing to a local log is a way to do exactly once;
    // we can write these directly to opfs?

    "insert into log(server, lsn, entry) values (?,?,?)"
    "insert into lastwrite(server, site, lsn) values (?,?,?)"

    let st = getSite(tx.server, tx.site)
    let s = tosend.get(tx.site)
    if (!s) {
        s = new SyncBatchUp(st.lsn)
    }
    s.tx.push(tx)
}

// call syncup when we get a commit, 
// call settimeout to retry the websocket connection if it fails
function syncup() {
    const a = encode({
        method: 'syncup',
        params: this.tosend
    })
    this.ws?.send(a)
    //this.sent.push(...this.tosend)
}


// associated with a socket connection
class Server {
    constructor(public url: string) {
        this.connect()
    }
    ws?: WebSocket
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


// we need to be able to roll back our local changes in order to keep them consistent with the global order
// we can keep the updates in a json field, then drop this field when it commits?
interface TableEntry {
    table: number   // defined by the site in its schema. 53 bit hash like fuschia?
    // map attribute to a value, for a crdt
    functor: [string, Uint8Array, [number, any][]][]
}
// cbor a batch of these
interface SyncTx {
    // maybe site and table should just be prefix compression onto the key?
    table?: TableEntry[]
}

// server://org.site.whatever/path/to/whatever
export interface Tx extends SyncTx {
    server: string
    site: string
    tx: SyncTx
}

// a tx is encrypted e2e
export interface SyncBatchDown {
    site: number
    gsn: number
    source: number
    lsn: number
    tx: Uint8Array //  encypted blob of Tx[]
}
class SyncBatchUp {
    constructor(lsn: number) { }    // prevent duplicates, we could allow the duplicates and fix on the client though?
    tx: Tx[] = []// encrypted blob
}

// there is a bit in the key that identifies a blob
// in this case the rest of the key is a blob handle
// the value is a bloblog

// spreadsheets do not need any special treatment over a database. They are strictly lww wins, with no special merging.

export interface SyncState {
    lastRead: number[] // pairs of numbers
}

export function sync(svr: Server, tx: SyncBatchDown[]) {
    "update lastread set gsn = ? where server = ? and site = ?"
}
// local transactions; these are also reflected into the watched ranges
// keep sqlite up to date
export function commit(tx: Tx) {


    // 
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
                    commit(lc,params)
                    break
                case 'scan':
                    scan(lc,params)
                    break
                case 'close':
                    close(lc,params.handle)
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


