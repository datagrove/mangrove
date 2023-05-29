// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { ListenerContext } from '../worker/data';
import { createListener } from '../worker/listen';

// possibly restore a snapshot in one go here?
// a full sqlite file? a zip file?
// in some ways sqlite is closer to what we want?
// opens up search possibilities?



interface ClientState {

}
type Ctx = ListenerContext<ClientState>

// can we use the first client to initialize the database?
// then return log messages to that client?
let db: any
const init = async (ctx: Ctx) => {

}

const api = {
    async connect(ctx: Ctx, params: any) {
        if (db) {
            return
        }
        const log = (...msg: string[]) => {
            ctx.log(...msg)
        }
        const error = (...msg: string[]) => {
            ctx.log("%c", "color: red", ...msg)
        }
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

            log('Creating a table...');
            db.exec('CREATE TABLE IF NOT EXISTS t(a,b)');
            log('Insert some data using exec()...');
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
        } catch (err: any) {
            error(err.name, err.message)
        }

        ctx.log("%c db started", "color: green")
    }
}
createListener(api, {} as ClientState)

