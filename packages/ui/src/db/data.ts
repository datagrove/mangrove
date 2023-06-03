import { Db } from "./db"


export interface TableUpdate {
    //like fuschia?
    // map attribute to a value, for a crdt
    // our functors can include the attribute name?
    key: Uint8Array[]
    functor: [string, any]
}

/*
export interface TableUpdate {
    type: 'replace' | 'delete'
    key: Uint8Array[]
    version: number
    value: Uint8Array[]  // in some cases this could be a delta too. we could invoke a blob then? maybe the (handle,length) of the bloglog changes to trigger.
} */

// server://org.site.whatever/path/to/whatever
export interface Tx  {
    server: string
    site: string
    table: {
        [table: string]: TableUpdate[]
    }
}

export interface Watch {
    server: string
    stream: string
    schema: string
    table: string
    from: Uint8Array
    to: Uint8Array
    limit: number
    offset: number
    attr: string[]
}

export function toBytes(b: Buffer) {
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT)
}

// each table that we scan needs a way to map its keys to a Uint8Array
export interface QuerySchema<Key> {
    marshalKey(key: Key) : Uint8Array 
}

export class RangeSource<Key,Tuple> {
    
    cache: ScanQueryCache<Tuple> = {
        anchor: 0,
        key: [],
        value: []
    }
    
    constructor(public db: Db, public q: ScanQuery<Key,Tuple>, public schema: QuerySchema<Key>) {
        // we have to send db thread a query
    }

    update(n: Partial<ScanQuery<Key,Tuple>>) {
        // we have to send db thread an update query
        this.db.w.send({
            method: 'updateScan',
            params: n
        })
    }

    // instead of the cache, we might want just the updates?
    async next() : Promise<ScanQueryCache<Tuple>>{
        // don't return until we have a new cache.
        return this.cache
    }

    close() {
        
    }
}

export function createQuery<Key,Tuple>(db: Db, t: QuerySchema<Key>, q: Partial<ScanQuery<Key,Tuple>>
    ) : RangeSource<Key,Tuple>{

        // assign q a random number? then we can broadcast the changes to that number?
    // we need a way to diff the changes that works through a message channel.
    // hash the key -> version number, reference count?
    // the ranges would delete the key when no versions are left.
    // we send more data than we need to this way?
    q.handle = db.next++
    db.w.send({
        method: 'scan',
        params: q
    })
    const rs = new RangeSource<Key,Tuple>(db, q as ScanQuery<Key,Tuple>, t)
    db.range.set(q.handle, rs)
    return rs
}



export interface ScanQuery<Key,Tuple> {
    anchor?: number
    from: Key
    to: Key
    handle: number
    server: string
    site: string    // the site can import the schema to give it versioning?
    table: string   // schema.table
    // one of from or two is needed.
    from_: Uint8Array // needs to include the site key
    to_: Uint8Array
    limit?: number
    offset?: number

    // these might be different because of limit. these are the actual boundary keys
    // that we read. we can use them to move the cursor forward or back (or even both ways)
    cache?: ScanQueryCache<Tuple>
}
export interface ScanQueryCache<Tuple> {
    anchor: number
    key: Uint8Array[]
    value: Tuple[]
}

// crdt blobs are collaborations on a single attributed string.
export interface CrdtEntry {
    contextDevice:  number
    contextLength: number
    at: number[] // keep or 
    insert: string[]
    format: {
        type: string
        start: number
        end: number
        desc: Uint8Array
    }[]
}
// these are just thrown away and not preserved in the document
// including cursor and maybe selection
export interface CellPresence {
    device: DeviceId
    format: {
        start: number
        end: number
        type: string
        desc: Uint8Array
    }[]
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

