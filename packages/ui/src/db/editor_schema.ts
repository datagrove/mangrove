import {Query, QuerySchema, Schema, Transaction, encodeNumber, standardFunctors} from './schema'

// lots of inefficiency convert to utf16.
const sql = [
    "create table if not exists site(sid integer primary key, server, site, lastread, lastwrite)",
    "create table if not exists log(lsn integer primary key, entry)",
    "create table if not exists file(id integer primary key, npath, path,type,size, mtime, ctime, summary)",
    "create table if not exists toast(id integer primary key, offset, content)",
    "create index if not exists file_path on channel(npath, path)",
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


export const chatTable : QuerySchema<{id: number, created: number }> = {
    name: 'chat',
    marshalKey: (key) => {
        let s =  encodeNumber(key.id)
        s += encodeNumber(key.created)
        return s
    },
    marshalRead1: (q) => [`select * from chat where id=? and created=? `, q.id, q.created],
    marshalWrite1: (q) => [`insert into chat (id, created) values (?,?)`, q.id, q.created],


}

// it's not clear we can get the type back after passing to the worker
export function readSql(q: QuerySchema<any>, tuple: any) {

}

export const schema : Schema =  {
    create: sql,
    view: {
        "chat": chatTable
    } ,
    functor: standardFunctors
}

export interface SqlApi {
}
export type FileKey = {
    id: number
}
export type FileByPath = {
    npath: number
    path: string
}
export type FileTuple = {
    id: number
    npath: number
    path: string
    type: string
    size: number
    mtime: number
    ctime: number
    summary?: string
}
export const select_file : Query< FileByPath ,FileTuple> = {
    sql: 'select * from file where npath=? and path=?'
}
export const select_file_recursive : Query< {path:string} ,FileTuple> = {
    sql: 'select * from file where  path=like ?'
}

export function insert_file(tx: Transaction,f: FileTuple){


}



export interface Author {
    id: number
    avatarUrl: string    
    username: string
    display: string // can change in the forum
}
export interface Reaction {
    author: number
    emoji: string
}
export interface Attachment {
    type: string
    url: string
}
export interface MessageData {
    id: number
    authorid: number
    text: string
    replyTo: number
    daten: number
}

// rollup after join. maybe this should be a chat group
// allows bubble formatting like signal
export interface Message extends MessageData{
    author: Author
    date: string
    reactions: Reaction[]
    attachment: Attachment[]
}
