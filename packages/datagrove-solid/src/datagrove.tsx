import { JSXElement, Show, createContext, createResource, onCleanup, useContext } from "solid-js"
import { GridSelection, NodeSelection, RangeSelection } from "lexical"
import { Peer, WorkerChannel, apiListen } from "../../abc/src"
import {DocBuffer,  RangeSource, TabStateBase, DgElement as DgElement, LensApi, lensServerApi, ScanQuery, ValuePointer } from "../../datagrove/src"
// credentials are stored in our user log. Each user will need a host for the user log, which is generally just the server this page is loaded from. 
export async function storeCredential(siteServer: string, credential: Uint8Array): Promise<void> {}
export class DatagroveValue extends TabStateBase {
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

export const SyncPathContext = createContext<DocBuffer>()
export function useSyncPath() { return useContext(SyncPathContext) }

export function SyncPath(props: {
  path: string | (() => string),
  fallback: JSXElement,
  children: JSXElement
}) {
  const prov = useDg()
  const ars = async (path: string) => { return {} as DocBuffer }
  const [rs] = createResource(props.path, ars)

  onCleanup(() => { rs()?.api.close() })

  return <Show fallback={props.fallback} when={!rs.loading}>
    <SyncPathContext.Provider value={rs()}>
      {props.children}
    </SyncPathContext.Provider></Show>
}

type LexSelection = null | RangeSelection | NodeSelection | GridSelection

export const TabStateContext = createContext<DatagroveValue>()
export const DatagroveContext = createContext<DatagroveValue>()
export function useDg() : DatagroveValue { 
  const r = useContext(DatagroveContext) 
  if (!r) throw "wrap with <Datagrove/>"
  return r
}

export function Datagrove(props: { children: JSXElement }) {
    const u = new DatagroveValue()
    return <DatagroveContext.Provider value={u}>
      {props.children}
    </DatagroveContext.Provider>
  }