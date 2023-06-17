import { JSXElement, Show, createContext, createResource, onCleanup, onMount, useContext } from "solid-js"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { GridSelection, NodeSelection, RangeSelection } from "lexical"
import { Peer, WorkerChannel, apiListen } from "../abc/rpc"
import { LensApi, lensServerApi, QuerySchema, ScanQuery, ServiceApi, ValuePointer } from "./mvr_shared"
import { DgElement as DgElement } from "./mvr_shared"

import LocalState from './mvr_worker?sharedworker'
import { MvrServer } from "./mvr_worker"
import { DocBuffer } from "./mvr_sync"
import { ScanDiff } from "../core/data"

// share an lex document
/*
  <TabState>  // tab level state, starts shared worker
  <SyncPath path={ } fallback={loading}> // support suspense while loading
    <Editor>  // editor level state
        <Sync>
    </Editor>
  </SyncPath>
  </TabState>
*/

// we need to pack the keys of any new tuples or diffing won't work?
// maybe all tuples just come packed though? the go server doesn't need this.
// the worker needs this code to keep it up to date.
// we could compile it into the worker for now.
export class RangeSource<Key,Tuple> {
  constructor(public db: TabStateValue, 
      public q: ScanQuery<Key,Tuple>, 
      public schema: QuerySchema<Key>, 
      public listener: (s: ScanDiff) => void) {
      // we have to send db thread a query
  }
  async update(n: Partial<ScanQuery<Key,Tuple>>) {

      // we have to send db thread an update query
      this.db.lc.updateScan(this.q.handle, n)
  }
  close() {
      this.db.lc.closeScan(this.q.handle) 
  }
}


// use the features of localState, implicitly uses tabstate provider
export function createQuery<Key, Tuple>(
  t: QuerySchema<Key>,
  q: Partial<ScanQuery<Key, Tuple>>,
  listener: (s: ScanDiff) => void): RangeSource<Key, Tuple> {

  const db = useDg()!
  // assign q a random number? then we can broadcast the changes to that number?
  // we need a way to diff the changes that works through a message channel.
  // hash the key -> version number, reference count?
  // the ranges would delete the key when no versions are left.
  // we send more data than we need to this way?
  q.handle = db.next++

  // change this to send scan to local state.
  // the range source we create will have options to use the update scan
  // clean up will close
  db.lc.scan(q as ScanQuery<Key, Tuple>)

  const rs = new RangeSource<Key, Tuple>(db, q as ScanQuery<Key, Tuple>, t, listener)
  onCleanup(() => {
    rs.close()
  })
  db.range.set(q.handle, rs)
  return rs
}


// we need to pack the keys of any new tuples or diffing won't work?
// maybe all tuples just come packed though? the go server doesn't need this.
// the worker needs this code to keep it up to date.
// we could compile it into the worker for now.
// export class RangeSource<Key,Tuple> {
//   constructor(public db: TabStateValue, public q: ScanQuery<Key,Tuple>, public schema: QuerySchema<Key>, public listener: (s: ScanDiff) => void) {
//       // we have to send db thread a query
//   }

//   // update(n: Partial<ScanQuery<Key,Tuple>>) {
//   //     // we have to send db thread an update query
//   //     this.db.w.send({
//   //         method: 'updateScan',
//   //         params: n
//   //     })
//   // }
//   // close() {
//   //     this.db.w.send({
//   //         method: 'close',
//   //         params: this.q.handle
//   //     })
//   // }
// }

// we need to open twice, essentially.
// the first open will absorb the big async hit, and will trigger suspense
// the second "subscribe"" will be when we have an editor ready to receive updates.
// we have to buffer the updates on the shared worker side, since it will await the updates to keep everything in sync

// when debugging we  can have more than one tab state in one tab
// there will be one cloud state so that can always be a global

// credentials are stored in our user log. Each user will need a host for the user log, which is generally just the server this page is loaded from. 
export async function storeCredential(siteServer: string, credential: Uint8Array): Promise<void> {

}



export const TabStateContext = createContext<TabStateValue>()
export function useDg() { return useContext(TabStateContext) }





export class TabStateValue {
  api!: Peer
  ps?: MvrServer


  // maybe a shared array buffer would be cheaper? every tab could process in parallel their own ranges
  // unlikely; one tree should save power.
  // we optimistically execute the query locally, and multicast the results to listeners
  // server can proceed at its own pase.

  // should we smuggle the source into the worker in order to pack keys?
  // can they all be packed prior to sending?
  /*
   updateScan( q: ScanQuery<any, any>) {
    const x = ts.cache.get(q.handle)
    const tbl = getTable(q.server, q.site, q.table)
  }
  
   scan( q: ScanQuery<any, any>) {
    const s = sv(q.server)
  
    // we need a way to compute a binary key
    const value: any[] = []
    db.exec({
        sql: q.sql,
        rowMode: 'array', // 'array' (default), 'object', or 'stmt'
        callback: function (row: any) {
            value.push(row);
        }.bind({ counter: 0 }),
    });
  
    const key = value.map(x => "")
  
    const sub: Subscription = {
        ctx: ts,
        query: q,
        cache:  value,
        lastSent: []
    }
    const tbl = getTable(q.server, q.site, q.table)
    tbl.add(q.from_, q.to_, sub)
  }*/

  makeWorker() {
    const sw = new LocalState()
    sw.port.start()
    this.api = new Peer(new WorkerChannel(sw.port))
  }
  makeLocal() {
    this.ps = new MvrServer()
    const mc = new MessageChannel()
    this.api = new Peer(new WorkerChannel(mc.port1))

    const svr = new Peer(new WorkerChannel(mc.port2))
    const r: ServiceApi = {
      open: this.ps.open.bind(this.ps),
    }
    apiListen<ServiceApi>(svr, r)
  }

  constructor() {
    this.makeLocal()
  }



  // the path here needs to give us the address of a cell in the database.
  // should it be structured, or parsed string? We probably need a string in any event so we can use it in the url
  // site.server.com/table?key{x}=value|value&attr=name
  // site.server.com/edit/proc/value/value/value
  // the procedure must return a table, row id, and column id; we can use this to uniquely identify the document. this can work together with range stabbing.
  // we can resolve this in the client, then pass the result to worker to keep complexity out of the worker.
  // we can reserve host 0 for being the origin host, site 0 can be the user's profile, and site 1 can be the subscription state

  async load(url: string): Promise<DocBuffer> {
    console.log("load", url)
    const u = new URL(url)
    // site can be in parameters or part of domain.
    const site = u.searchParams.get("site")
    const siteServer = site + u.hostname
    //const sch =  await this.schema(siteServer)

    // the first part of path is ignored, it is used for the tool that uses the value.
    const [tool, proc, ...value] = u.pathname.split("/")
    return this.loadPointer([0, 0, 0, 0, 0])
  }
  async loadPointer(locator: ValuePointer): Promise<DocBuffer> {
    const mc = new MessageChannel()
    const json = await this.api.rpc<DgElement[] | string>("open", [locator, mc.port2], [mc.port2])
    console.log("json", json)
    const wc = new Peer(new WorkerChannel(mc.port1))
    if (typeof json === "string") {
      throw new Error(json)
    }
    const db = new DocBuffer(lensServerApi(wc), json)
    const r: LensApi = {
      update: db.updatex.bind(db),
    }
    apiListen<LensApi>(wc, r)
    return db
  }
}
export function TabState(props: { children: JSXElement }) {
  const u = new TabStateValue()
  return <TabStateContext.Provider value={u}>
    {props.children}
  </TabStateContext.Provider>
}

export const SyncPathContext = createContext<DocBuffer>()
export function useSyncPath() { return useContext(SyncPathContext) }


export function SyncPath(props: {
  path: string | (() => string),
  fallback: JSXElement,
  children: JSXElement
}) {
  const prov = useDg()!
  const ars = async (path: string) => { return await prov.load(path) }
  const [rs] = createResource(props.path, ars)

  onCleanup(() => { rs()?.api.close() })

  return <Show fallback={props.fallback} when={!rs.loading}>
    <SyncPathContext.Provider value={rs()}>
      {props.children}
    </SyncPathContext.Provider></Show>
}

export function Sync() {
  const st = useSyncPath()
  const [editor] = useLexicalComposerContext()

  onMount(async () => {
    console.log("sync", st, editor)
    st?.subscribe(editor)
  })

  return <></>
}

type LexSelection = null | RangeSelection | NodeSelection | GridSelection