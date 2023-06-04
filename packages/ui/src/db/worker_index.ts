

// create the full text index as a seperate database
// the parent database reads its log and sends pieces to the index database
// the intent is to do the indexing off the main thread

// should this allow a MessageChannel from tabs, or force them to go through the leader database? In theory search could be slightly faster without the extra hop.

// when we insert, we need to not only update the local table, but log the update for sync, and trigger any listeners. we can read the sync log to 
// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const log = console.log.bind(console)

 async function start() {
    let sqlite3 : any = await sqlite3InitModule({
        print: log,
        printErr: log,
    })
    try {
        log('Index started ', sqlite3.version.libVersion);
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

        
        log('Created tables');
    } catch (err: any) {
        log(err.name, err.message)
    }

    self.onmessage = (e: any) => {
        const { method, id, params } = e.data as {
            method: string
            id: number
            params: any
        }
        
        switch (method) {
            case 'search':

        }
    }

}
start()


