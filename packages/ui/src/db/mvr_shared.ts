import { Peer, apiCall } from "../abc/rpc"
import { FileByPath, FileTuple } from ".";
import crypto from 'crypto'

// server://org.site.whatever/path/to/whatever
// export interface Tx  {
//   siteid: number // determines the server and the site, this is a local rowid from the $site table. This is only used for inserts. The rowid for an insert is used to return a map to the committed rowid if the app cares to await it.
//   table: {
//       [table: string]: TableUpdate[]
//   }
// }


// server://org.site.whatever/path/to/whatever
// export interface Tx  {
//   server: string
//   site: string
//   table: {
//       [table: string]: TableUpdate[]
//   }
// }
export type Txc = [
  number, // tupe id indicating server and site.
  number, // method hash
  ...any // each method indicates the number and type of arguments
][]

export class TxBuilder {
  // tx: Tx = {
  //   siteid: 0, 
  //   table: {},
  //   server: "",
  //   site: ""
  // }
  txc: Txc
  site = 0
  constructor(public dbms: Db) {
    this.txc = []
  }

//   insert(table: string, tuple: any) {
//     this.tx[table] = this.tx[table] || []
//     this.tx[table].push({op: 'insert', tuple})
// }
  async useSite(server: string, site: string): Promise<void> {
    return
  }
  async commit(): Promise<string>{
    return ""
  }
}


export function methodHash(data: string): number {
  const hash = crypto.createHash('sha256').update(data).digest();
  const bits = hash[0] << 24 | hash[1] << 16 | hash[2] << 8 | hash[3];
  return bits >>> 1; // shift right by 1 to get 31 bits
}

// build functions that add a functor to the transaction
const insert_file_hash = methodHash("insert-file")
function insert_file(tx: TxBuilder, file: FileByPath) {
  tx.txc.push([tx.site, insert_file_hash, file])
}


// store in tabstate. 
export class Db {
  begin() { return new TxBuilder(this) }
}

// use with createResource
// export async function dbr(dbms: dbms, server: string, site: string): Promise<Db> {
//   return new
// }


export function exec<Params,Tuple>(db: Db, 
    select_file: Query<Params, Tuple>, 
    arg: Params)
    : Promise<FileTuple[]> {

    throw new Error("Function not implemented.");
}


// this is all accessed from the worker thread
export interface Structured {
  attribute: { [key: string]: string }
  children: Structured[]
}
export interface Tuple {
  _id: number,  // globally or universally unique id. universal is obtained  from the host
  _uid: number, // universal id.
  _table: string,
  [key: string]: number | string | Structured
}
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



export function npath(path: string) : number {
  return path.split('/').length
}

export interface Database {
  
}
export interface RangeSubscriber {

}
export function rangeSubscriberApi(mc: Peer) : RangeSubscriber {
    return apiCall<RangeSubscriber>(mc, "range") 
}




// [ host, site, table, rowid, columnid]
// we can use queries to return a tuple pointer. we can use the tuple pointer to initiate an editor

export type ValuePointer = [number,number,number,number,number]
export type TuplePointer = [number,number,number,number]

export interface DgElement {
  id: string
  v: number // increment each time
  conflict: string
  type: string
  parent?: string
  children: string[]
}
// shared state.


export interface ServiceApi {
    open(url: ValuePointer,ch: MessagePort ): Promise<DgElement[]|string>
}
export function serviceApi(ch: Peer): ServiceApi {
    return apiCall(ch, "open")
}

//type LexSelection = null | RangeSelection | NodeSelection | GridSelection
// receive updates to a sequence
export interface SiteRef {
  name: string
  did: string
}

export type FacetSelect<T> = {
  limit?: number
  offset?: number
}

export interface Etx {
  id: number
  data: Uint8Array
  lock: number[]
  lockValue: number[]
}
export interface AuthApi {
  login(challenge: Uint8Array, user: string, response: Uint8Array): Promise<void>
}
export interface CommitApi {
  commit(tx: Etx): Promise<number>
}
// subscribe is a commit to the user database.

// tail updates are best effort and may not include the bytes when the lock server is under stress. it may not update every tail (based on load an capacity), but will prioritize according to subscription weight stored in the subscription database.
type TailUpdate = [number, Uint8Array]
export interface SubscriberApi {
  sync(length: number, tail: TailUpdate[]) : Promise<void>
}
export function subscriberApi(ch: Peer): SubscriberApi {
    return apiCall(ch, "sync")
}


export interface KeeperApi {
  read(id: number, at: number, size: number): Promise<Uint8Array|string>
}

export type KeyMap = [string, string][]

export interface LensApi {
  update(ins: DgElement[], upd: DgElement[], del: string[], selection: DgSelection) : Promise<KeyMap>
}
export function lensApi(ch: Peer): LensApi {
    return apiCall(ch, "update")
}

export interface LensServerApi {
  update(upd: DgElement[], del: string[], sel: DgSelection): Promise<void>
  subscribe(key: KeyMap): Promise<void>
  close(): Promise<void>
}
export function lensServerApi(ch: Peer): LensServerApi {
  return apiCall(ch, "update", "subscribe","close")
}

export interface Upd {
  op: "upd" | "ins"
  v: DgElement
}
export interface Del {
  op: "del"
  id: string
}
export type Op = Upd | Del

export function topologicalSort(elements: DgElement[]): [DgElement[],{[id:string]:DgElement}] {
  console.log("elements", elements)
  const id: { [id: string]: DgElement } = {};
  const visited: { [id: string]: boolean } = {};
  const sorted: DgElement[] = [];

  for (const element of elements) {
      id[element.id] = element;
  }
  //console.log("idxx", elements.map(e => [e.id, ...e.children]))

  const visit = (element: DgElement) => {
      if (visited[element.id]) {
          return;
      }
      visited[element.id] = true;
      for (const childId of element.children) {
          const child = id[childId]
          if (child) {
              visit(child);
          } else {
              throw new Error(`child ${childId} not found`)
          }
      }
      // only push if all children have been visited.
      sorted.push(element);
  };

  for (const element of elements) {
      visit(element);
  }
  //console.log("sorted", sorted.map(e => [e.type+"."+e.id, ...e.children]))
  return [sorted,id];
}

interface RangeSelection {
  type: "range"
  start: string
  end: string
  startOffset: number
  endOffset: number
}
interface NodeSelection {
  type: "node"
  node: string
}
interface GridSelection {
  type: "grid"
  topLeft: string
  bottomRight: string
}

export type DgSelection = (RangeSelection | NodeSelection | GridSelection)[]



// these only live in the tab. not imported by the worker

export interface TableUpdate {
    //like fuschia?
    // map attribute to a value, for a crdt
    // our functors can include the attribute name?
    // any must include the 
    tuple: unknown   // must include primary key, so to be encodable
    op: string  // lookup in schema
}

/*
export interface TableUpdate {
    type: 'replace' | 'delete'
    key: Uint8Array[]
    version: number
    value: Uint8Array[]  // in some cases this could be a delta too. we could invoke a blob then? maybe the (handle,length) of the bloglog changes to trigger.
} */



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