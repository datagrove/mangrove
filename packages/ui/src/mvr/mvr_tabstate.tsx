import { JSXElement, Show, createContext, createResource, onCleanup, onMount, useContext } from "solid-js"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { GridSelection, NodeSelection, RangeSelection } from "lexical"
import { Peer, WorkerChannel, apiListen } from "../abc/rpc"
import { LensApi, lensServerApi, ServiceApi } from "./mvr_shared"
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

  async load(path: string): Promise<DocBuffer> {
    const mc = new MessageChannel()
    const json = await this.api.rpc<DgElement[]>("open", [path, mc.port2], [mc.port2])
    console.log("json", json)
    const wc = new Peer(new WorkerChannel(mc.port1))
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


export function SyncPath(props: { path: string|(()=>string), fallback: JSXElement, children: JSXElement }) {
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