import { JSXElement, Show, createContext, createResource, onCleanup, onMount, useContext } from "solid-js"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { GridSelection, NodeSelection, RangeSelection } from "lexical"
import { Peer, TransferableResult, WorkerChannel, apiListen } from "../abc/rpc"
import { LensApi, lensServerApi, scanApi, ScanApi, ScanQuery, ScanWatcherApi, ServiceApi, TabStateApi, ValuePointer } from "./mvr_shared"
import { DgElement as DgElement } from "./mvr_shared"

// @ts-ignore
import LocalState from './mvr_worker?sharedworker'
// @ts-ignore
import DbWorker from './sqlite_worker?worker'

// @ts-ignore
import LogWorker from './opfs_worker?worker'

import { MvrServer } from "./mvr_worker"
import { DocBuffer } from "./mvr_sync"
import { dbLiteApi } from "./sqlite_api"

export class RangeSource<Key, Tuple> {
  api: ScanApi
  constructor(public mp: MessagePort, public q: ScanQuery<Key, Tuple>) {
    //public schema: QuerySchema<Key>, 
    // public listener: (s: ScanDiff) => void)
    {
      // we have to send db thread a query
      let peer = new Peer(new WorkerChannel(mp))
      this.api = scanApi(peer)
      apiListen<ScanWatcherApi>(peer, {
        update: function (q: any[]): Promise<void> {
          throw new Error("Function not implemented.")
        }
      })
    }
  }
}

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

// one reason to make this a provider is that we can control the loading interface (fallback, etc)
// acts more like a signal than a resource?
// what do we do with the schema?

// use the features of localState, implicitly uses tabstate provider
// should return a function that can be used in createResource? should call createResource here?
// export async function createQuery<Key, Tuple>(t: QuerySchema<Key>,
//   q: Partial<ScanQuery<Key, Tuple>>,
//   listener: (s: ScanDiff) => void): Promise<RangeSource<Key, Tuple>> {
//   const db = useDg()!
//   const rs = await db.scan(t)
//   onCleanup(() => {
//     rs.api.close()
//   })
//   return rs
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

  async createDb() {
    const lw = new LogWorker()
    const lwp = new MessageChannel()
    const lapi = new Peer(new WorkerChannel(lwp.port1))

    const db = new DbWorker()
    const dbp = new MessageChannel()
    const dbapi = new Peer(new WorkerChannel(dbp.port1))
    const api = dbLiteApi(dbapi)
    // send the api (transfer the port) to the server
    return new TransferableResult([api,lw], [dbp.port2,lwp.port2])
  }

  makeWorker() {
    const sw = new LocalState()
    sw.port.start()
    this.api = new Peer(new WorkerChannel(sw.port))
    apiListen<TabStateApi>(this.api, {
      createDb: this.createDb.bind(this),
    })
  }

  // we need to configure the server to use a local test server
  makeLocal() {
    const mcc = new MessageChannel()
    const capi = new Peer(new WorkerChannel(mcc.port1))

    // we need to get it a dictionary of local fake server for testing.
    // or maybe we can just use a test:// protocol to indicate this?
    // either way we have to get it pointed to the test server as host
    this.ps = new MvrServer({ origin: "ws://localhost:8080/"})

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

  async scan(q: ScanQuery<any, any>): Promise<RangeSource<any, any>> {
    const mc = new MessageChannel()
    const json = await this.api.rpc<DgElement[] | string>("scan", [q, mc.port2], [mc.port2])
    console.log("json", json)
    const wc = new Peer(new WorkerChannel(mc.port1))
    if (typeof json === "string") {
      throw new Error(json)
    }

    const r = new RangeSource(mc.port1, q)
    return r
  }
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