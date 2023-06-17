
// this is separate from TabState because we we don't necessarily have tab state in a console app
// using global exec function gives more flexibility in typing than class methods.

import { Query,FileByPath, FileTuple, Tx } from ".";

export class TxBuilder {
  constructor(public db: Db) {}

  async commit(): Promise<string>{
    return ""
  }
}
export class Db {
    begin(): Tx {
        throw new Error("Method not implemented.");
    }

}

export function exec(db: Db, 
    select_file: Query<FileByPath, FileTuple>, 
    arg2: any)
    : FileTuple[] | PromiseLike<FileTuple[]> {

    throw new Error("Function not implemented.");
}
