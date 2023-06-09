import { ApiSet, Channel, apiSet } from "../abc/rpc"
import { Schema, TableUpdate, Tx , Keyed, LensRef} from "../dblite/schema"

// this is used from worker and implemented by the tab
export interface TabStateClient   {
   getDb(schema: Schema) : Promise<MessagePort>
   // notifies that a an open 
   update(handle: number, diff: ScanDiff) : Promise<void>

}

export function TabStateClientApi(mc: Channel)  {
    return apiSet<TabStateClient>(mc,"becomeLeader", "update") 
}

export interface Stat {
    writable: boolean  
    length: number
    // last good snapshot
    snapBegin: number
    snapEnd: number
}
export interface Snapshot {
    next: number // next snapshot.

    author: number
    begin: number
    end: number 
}
export type Err = string
// path here is referring to a cell location?
// we want to be able to overflow to a external dictionary of logs
// the log dictionary is written by individual devices, but tabs coordinate to use the same log
// when we query the table, we want to show a summary of, opening to full doc

// subscription here is a site, not a tuple.
// 
export interface Scan<T> {
    table: string, 
    start: T, 
    end: T,
    limit: number,
    offset: number,
}
// LocalStateClient used by the tab
export interface LocalStateClient{
    // read(path: string, start: number, end: number) : Promise<Uint8Array|Err>
    // open(path: string) : Promise<Stat|Err>
    // subscribe(handle: number, from: number) : Promise<number|Err>
    //   publish(handle: number, patch: Uint8Array) : Promise<undefined|Err>,
    // close(handle: number): Promise<void>
    // write(handle: number, a: Uint8Array) : Promise<number|Err>

    // database api.
    tuple(lens: LensRef) : Promise<number|Err>
    scan<T=any>(scan: ScanQuery<any,any>) : Promise<number|Err>
    updateScan<T=any>(handle: number, scan: Partial<ScanQuery<any,any>>) : Promise<undefined|Err>
    closeScan(handle: number) : Promise<void>
    exec<T=any>(sql: string, params?: any) : Promise<T[]|Err>
    commit(tx: Tx) : Promise<Err|undefined>

    // try to call before disconnecting a tab. This still disrupts other tabs if this is the leader
    unload() : Promise<void>
}

export function LocalStateClientApi(mc: Channel) {
    return apiSet<LocalStateClient>(mc, "scan", "query","lens","commit")
}


// the keeper client can be locally hosted, and use R2
// a keeper server can aggressively shed data to R2, and respond "r2"
export interface KeeperClient  {
   read(site: number, start: number, end: number) : Promise<Uint32Array|Err> 
   // clients can write directly to their own log by first getting a permission from the host. this is complex though? r2 does allow files to be appended, so it must be chunked, and tail file must be replaced
   write(site: number, at: number,  a: Uint32Array): Promise<Err|undefined>
   append(site: number,at: number, a: Uint32Array) : Promise<Err|undefined>
}
export function KeeperClientApi(mc: Channel) {
    return apiSet<KeeperClient>(mc, "read", "write") 
}

// add authorization apis etc.
export interface HostClient  {
    // we can't query this (like localstate), because it can't decrypt the data.
    // we don't read it because go straight to the keeper for that.
    // publish here is sequencing of device.log pairs.
    // subscribe and handled by writing into a table shared with the host.
    // publishes are less likely to be batches, but might as well

    // logs are (site, device, length) tuples.
    // we can be a little tricky in rewriting the tail to get better compression but probably not worth it in real time 
    // separate arrays here to allow better compression
    create(path: string) : Promise<number|Err>,
    publish(site: number[], length: number[]) : Promise<undefined|Err>,
    authorize(site: number, length: number) : Promise<string[]|Err>,
}
export function HostClientApi(mc: Channel) {
    return apiSet<HostClient>(mc, "publish", "authorize") 
}


export interface LocalStateFromHost  {
    // vbyte encode this? cbor gives us free compression, but vbyte probably better 2.0
    update(site: number[], length: number[]) : Promise<void>
}
export function LocalStateFromHostApi(mc: Channel) {
    return apiSet<LocalStateFromHost>(mc, "update") 
}

import { QuerySchema } from "../dblite/schema"

// these only live in the tab. not imported by the worker





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

export interface ScanDiff {
    tuple: any[]
    copy: DiffCopy[]   // triples: [whichvector, from, to]
    size: number     // redundant
}
// interface ScanDiff {
//     tuple: Keyed[];
//     copy: { which: number; start: number; end: number }[];
//     size: number;
//   }

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