
import { create } from "sortablejs";
import { ListenerContext, ServiceFn, createSharedListener } from "../worker";
import { Listener } from "lexical/LexicalEditor";
// @ts-ignore

// this is like main for the shared worker, it's only executed once per session. opening a tab will create a new client state.
interface ClientState {

}
type Ctx = ListenerContext<ClientState>

// these can be optimistic, and allow the reader to pull what they need directly from the shared buffer, or we can copy directly into a temporary buffer that is charged to the transaction.


const api = {
  async connect(context: Ctx, params: any) {
  },
  // what do we need to do here? reference count?
  async disconnect(context: Ctx, params: any) {

  }
}

// can we use the first client to initialize the database?
// then return log messages to that client?
let db: any
const init = async (ctx: Ctx) => {
  if (db) {
    return
  }
  const log = (...msg: string[]) => {
    ctx.log(...msg)
  }
  const error = log
  let sqlite3 = await sqlite3InitModule({
    print: log,
    printErr: error,
  })
  const start = function () {
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

  };

  log('Sqlite initialized');
  try {
    start();
  } catch (err: any) {
    error(err.name, err.message);
  }

  ctx.log("%c db started", "color: green")
}
createSharedListener(api, {} as ClientState, init)



// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';





