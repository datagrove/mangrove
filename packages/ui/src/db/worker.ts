
// @ts-ignore
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';


// returns a db:any, but when do you close?

export type LOG = (...args: any[]) => void
export class Dbx {
  constructor(public db: any, public log: LOG) {

  }
  close() {
    this.log("Closing db")
    this.db.close()
  }

}
export async function openDb(log: LOG) {
  let db = await initSqlite(log)
  return new Dbx(db, log)
}
export async function initSqlite(log: (...args: any[]) => void) {

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
}