
// lots of inefficiency convert to utf16.
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

// the schema needs to be in the worker and in the tab
// the name here must be unique and 
export interface QuerySchema<Key> {
    name: string
    marshalKey(key: Key) : string 
    //marshalRead(key: Query) : string
    marshalRead1(key: Key) : any[]
    marshalWrite1(key: Key) : any[]

    // functors are nameable operations that can be applied to a tuple and an update
    // mostly one x = y of update table. 
    functor: {
        [name: string]: (tuple: any, update: any) => any
    }

}

const encodeNumber = (n: number) => n.toString(16).padStart(15, '0')


export const chatTable : QuerySchema<{id: number, created: number }> = {
    name: 'chat',
    marshalKey: (key) => {
        let s =  encodeNumber(key.id)
        s += encodeNumber(key.created)
        return s
    },
    marshalRead1: (q) => [`select * from chat where id=? and created=? `, q.id, q.created],
    marshalWrite1: (q) => [`insert into chat (id, created) values (?,?)`, q.id, q.created],

    functor: {
        "set": (tuple, update) => ({ ...tuple, ...update})
    }
}

// it's not clear we can get the type back after passing to the worker
export function readSql(q: QuerySchema<any>, tuple: any) {

}

export interface Schema {
    create: string[],
    view: {
        [name: string]: QuerySchema<any>
    }
}

export const schema : Schema =  {
    create: sql,

    view: {
        "chat": chatTable
    } 
}