

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

export interface ScanQuery {
    server: string
    site: string    // the site can import the schema to give it versioning?
    table: string   // schema.table
    // one of from or two is needed.
    from: Uint8Array // needs to include the site key
    to: Uint8Array
    limit?: number
    offset?: number

    // these might be different because of limit. these are the actual boundary keys
    // that we read. we can use them to move the cursor forward or back (or even both ways)
    cache?: ScanQueryCache
}
export interface ScanQueryCache {
    anchor: number
    key: Uint8Array[]
    value: Uint8Array[]
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
