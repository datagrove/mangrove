import { JSXElement, Show, createContext, createResource, onCleanup, useContext } from "solid-js"
import {DocBuffer,  DatagroveState } from "../../datagrove/src"
// credentials are stored in our user log. Each user will need a host for the user log, which is generally just the server this page is loaded from. 
export async function storeCredential(siteServer: string, credential: Uint8Array): Promise<void> {}
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

export const DatagroveContext = createContext<DatagroveState>()
export function Datagrove(props: { children: JSXElement }) {
    const u = new DatagroveState()
    console.log("Datagrove", u)
    return <DatagroveContext.Provider value={u}>
      {props.children}
    </DatagroveContext.Provider>
  }

  export function useDg() : DatagroveState { 
    const r = useContext(DatagroveContext) 
    if (!r) throw "wrap with <Datagrove/>"
    return r
  }