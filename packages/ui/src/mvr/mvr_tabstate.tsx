import { JSXElement, Show, createContext, createResource, onCleanup, onMount, useContext } from "solid-js"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { GridSelection, NodeSelection, RangeSelection } from "lexical"
import { Peer, WorkerChannel, apiListen } from "../abc/rpc"
import { LensApi, lensServerApi, ServiceApi, ValuePointer } from "./mvr_shared"
import { DgElement as DgElement } from "./mvr_shared"

import LocalState from './mvr_worker?sharedworker'
import { MvrServer } from "./mvr_worker"
import { DocBuffer } from "./mvr_sync"

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
    const r : ServiceApi = {
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

  async load(url: string) : Promise<DocBuffer> {
    console.log("load", url)
    const u = new URL(url)
    // site can be in parameters or part of domain.
    const site = u.searchParams.get("site")
    const siteServer = site + u.hostname
    //const sch =  await this.schema(siteServer)

    // the first part of path is ignored, it is used for the tool that uses the value.
    const [tool, proc, ...value] = u.pathname.split("/")
    return this.loadPointer([0,0,0,0,0])
  }
  async loadPointer(locator: ValuePointer ): Promise<DocBuffer> {
    const mc = new MessageChannel()
    const json = await this.api.rpc<DgElement[]|string>("open", [locator, mc.port2], [mc.port2])
    console.log("json", json)
    const wc = new Peer(new WorkerChannel(mc.port1))
    if (typeof json === "string") {
      throw new Error(json)
    }
    const db = new DocBuffer(lensServerApi(wc), json)
    const r : LensApi = {
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
  path: string|(()=>string), 
  fallback: JSXElement, 
  children: JSXElement }) {
  const prov = useDg()!
  const ars = async (path: string) => { return await prov.load(path) }
  const [rs] = createResource(props.path, ars)
  
  onCleanup(() => { rs()?.api.close() })

  return <Show fallback={props.fallback} when={!rs.loading }>
    <SyncPathContext.Provider value={rs()}>
      {props.children}
    </SyncPathContext.Provider></Show>
}

export function Sync() {
  const st = useSyncPath()
  const [editor] = useLexicalComposerContext()

  onMount(async () => {
    console.log("sync", st,editor)
    st?.subscribe(editor)
  })

  return <></>
}

type LexSelection = null | RangeSelection | NodeSelection | GridSelection