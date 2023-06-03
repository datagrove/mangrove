import { Db } from "./db"
import { QuerySchema } from "./schema"

// these only live in the tab. not imported by the worker

export interface TableUpdate {
    //like fuschia?
    // map attribute to a value, for a crdt
    // our functors can include the attribute name?
    // any must include the 
    tuple: unknown   // must include primary key, so to be encodable
    functor: string  // lookup in schema
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

// we need to pack the keys of any new tuples or diffing won't work?
// maybe all tuples just come packed though? the go server doesn't need this.
// the worker needs this code to keep it up to date.
// we could compile it into the worker for now.
export class RangeSource<Key,Tuple> {
    constructor(public db: Db, public q: ScanQuery<Key,Tuple>, public schema: QuerySchema<Key>, public listener: (s: ScanDiff) => void) {
        // we have to send db thread a query
    }
    update(n: Partial<ScanQuery<Key,Tuple>>) {
        // we have to send db thread an update query
        this.db.w.send({
            method: 'updateScan',
            params: n
        })
    }
    close() {
        this.db.w.send({
            method: 'close',
            params: this.q.handle
        })
    }
}

export interface ScanQuery<Key,Tuple> {
    sql: string
    anchor?: number
    from: Key
    to: Key
    handle: number
    server: string
    site: string    // the site can import the schema to give it versioning?
    table: string   // schema.table
    // one of from or two is needed.
    from_: string // needs to include the site key
    to_: string
    limit?: number
    offset?: number

    // these might be different because of limit. these are the actual boundary keys
    // that we read. we can use them to move the cursor forward or back (or even both ways)
    cache?: ScanQueryCache<Tuple>
}
export interface ScanQueryCache<Tuple> {
    value: Tuple[]
}


export function binarySearch(arr: Keyed[], target: string): number {
    let left = 0;
    let right = arr.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid]._key === target) {
        return mid;
      } else if (arr[mid]._key < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return -1;
  }
interface DiffCopy 
    {which: 0|1, start: number, end: number}

interface ScanDiff {
    tuple: any[]
    copy: DiffCopy[]   // triples: [whichvector, from, to]
    size: number     // redundant
}

function computeDiff(old: any[], newer: any[], compare: (a:any,b:any)=>number) : ScanDiff {   
    let d: ScanDiff = {
        tuple: [],
        copy: [],
        size: 0
    }
    let i = 0
    let j = 0
    while (i<old.length && j<newer.length) {
        const c = compare(old[i], newer[j])
        if (c<0) {
            const k = i++
            while (i<old.length && compare(old[i], newer[j])<0) 
                i++
            d.copy.push({which: 0, start: k, end: i})
        } else if (c>0) {
            const k = i++
            let st = d.tuple.length
            while (j<newer.length && compare(old[i], newer[j])>0) {
                d.tuple.push(newer[j++])
                d.copy.push({which: 1, start: j, end: j+1})
            }
            d.copy.push({which: 1, start: j, end: i})
        } else {
            d.copy.push({which: 1, start: j, end: j+1})
            d.tuple.push(newer[j++])
            i++
        }
    }
 
    return d
}
function applyDiff(old: string[], diff: ScanDiff) : any[] {
    let n = new Array<any>(diff.size)
    let j = 0
    diff.copy.forEach((c: DiffCopy) => {
        const src = c.which?diff.tuple:old
        for (let i=c.start; i<c.end; i++) {
            n[j++] = src[i]
        }
    })
    return n
}