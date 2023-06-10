// this must be in a worker to get opfs\
// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { Schema } from './schema';
import { ApiSet, Channel, Service } from '../abc/rpc';
import { DbLiteClient } from './api';
const ctx = self as any;

// @ts-ignore
const isWorker = self instanceof DedicatedWorkerGlobalScope

let db: any // sqlite3 database

const log = (...args: any[]) => {
    ctx.postMessage({
        method: 'log',
        params: args
    })
}
const error = (...msg: string[]) => {
    log("%c", "color: red", ...msg)
}

async function start(schema: Schema) {
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
}

export class DbLite implements Service {
    constructor(s: Schema) {
        start(s)
    }
    disconnect(ch: Channel): void {

    }

    connect(ch: Channel): ApiSet {
        const r: DbLiteClient = {
            query:  async (sql: string, ...bind: any[]) : Promise<any>  => {
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
            },
            
        }
    
        return r
    }

}


/*
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
*/