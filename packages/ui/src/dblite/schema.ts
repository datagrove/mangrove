

// the schema needs to be in the worker and in the tab

export interface TableUpdate {
    //like fuschia?
    // map attribute to a value, for a crdt
    // our functors can include the attribute name?
    // any must include the 
    tuple: unknown   // must include primary key, so to be encodable
    op: string  // lookup in schema
}

// note that siteid is not specified here because it is determined by the rowid
// otoh, transactions cannot always know the rowid, since the transaction may be inserting a new row. If all the table updates are existing rows, there is no need for a siteid in the transaction, but if there are inserts, then the transaction needs to know the siteid of the new row.
export interface LensRef {
	table: string
	rowid: number
	column: string
}
// server://org.site.whatever/path/to/whatever
export interface Tx  {
    siteid: number // determines the server and the site, this is a local rowid from the $site table. This is only used for inserts. The rowid for an insert is used to return a map to the committed rowid if the app cares to await it.
    table: {
        [table: string]: TableUpdate[]
    }
}

export interface Keyed {
    _key: string;
  }

// the name here must be unique and 
export interface QuerySchema<Key> {
    name: string
    marshalKey(key: Key) : string 
    //marshalRead(key: Query) : string
    marshalRead1(key: Key) : any[]
    marshalWrite1(key: Key) : any[]

    // functors are nameable operations that can be applied to a tuple and an update
    // mostly one x = y of update table. 

}

export interface Query<Params, FileTuple> {
    sql: string
}
const q1: Query<{id: number}, {id: number}> = {
    sql: ''
}
function exec<Params,Tuple>(db: Database, q: Query<Params,Tuple>, params: Params) : Tuple[]{
    return []
}

export const encodeNumber = (n: number) => n.toString(16).padStart(15, '0')

type FunctorMap =  {
    [name: string]: (tuple: any, update: any) => any
}
export interface Schema {
    create: string[],
    view: {
        [name: string]: QuerySchema<any>
    },

    functor: FunctorMap

}

// we probably need a context; we might need the primary key that we can write to?
// 1. Write a new file (opfs), 2. write tuple referencing the new snapshot, 3. delete the old snapshot.
export const standardFunctors : FunctorMap = {
    "set": (tuple, update) => ({ ...tuple, ...update}),
    "crdt": (tuple, update) => {

    }
}

export abstract class Transaction {
     tx  = {} as {
        [table: string]: TableUpdate[]
    }
    
    insert(table: string, tuple: any) {
        this.tx[table] = this.tx[table] || []
        this.tx[table].push({op: 'insert', tuple})
    }
    abstract commit() : void
}

export function npath(path: string) : number {
    return path.split('/').length
}

export interface Database {
    
}

