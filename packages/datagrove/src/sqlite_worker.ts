// this must be in a worker to get opfs\
// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { Peer, WorkerChannel, apiListen } from '../../abc/src';
import { DbLiteApi } from './sqlite_api';
const ctx = self as any;

// we can load in memory for testing, but it needs to be in a worker for opfs

// @ts-ignore
const isWorker = self instanceof DedicatedWorkerGlobalScope

let db: any // sqlite3 database

const log = (...args: any[]) => {
   console.log(...args)
}
const error = (...msg: string[]) => {
    console.log("%c", "color: red", ...msg)
}


export class DbLite  {

    static async create() {
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
        } catch (err: any) {
            error(err.name, err.message)
        }
    
        // this has a ways to go, we want a way that we can wire up a MessageChannel from any tab to the database worker in the leader.
        const connect = (read: any, write: any) => {
            log("%c db started", "color: green")
            read.onmessage = (e: any) => {
                const { method, id, params } = e.data as {
                    method: string
                    id: number
                    params: any
                }
                log('rpc', e.data)
            }
        }
        connect(ctx, ctx)
        return new DbLite()
    }
    

    async exec (sql: string, ...bind: any[]) : Promise<any>   {
        const r : any[]= []
        db.exec({
            sql: sql,
            bind: bind,
            rowMode: 'object', // 'array' (default), 'object', or 'stmt'
            callback: function (row: any) {
                r.push(row)
            },
        })
        return r
    }
    async close(): Promise<void> {
    }
}

(async () => {
    self.onmessage = async (e: any) => {
        console.log('sqlite worker')
        const svc = await DbLite.create()
        const p = new Peer(new WorkerChannel(e.data))  // message port
        const r:  DbLiteApi = {
            close: svc.close.bind(svc),
            exec: svc.exec.bind(svc)
        }
        apiListen<DbLiteApi>(p, r)
    }
})()

