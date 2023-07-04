import { Accessor, JSXElement, Show, createContext, createEffect, createResource, createSignal, onCleanup, onMount, useContext } from "solid-js"
import SimpleWorker from './simple_worker.ts?sharedworker'
import { DocState, OmPeer, OmState, OmStateJson, Op } from "./om"
import { useLexicalComposerContext } from "../../../lexical-solid/src/lexical/lexical-solid"
import { $getNodeByKey, $getRoot, $parseSerializedNode, EditorState, ElementNode, LexicalNode, NodeKey, TextNode } from "lexical"
import { Channel, Listener, Peer, WorkerChannel, apiListen } from "../abc/src/rpc"
import { LensApi, ServiceApi, lensApi, serviceApi } from "./simple_sync_shared"
import { on } from "events"

// objective is to share a ordered tree, like xml
// without specifying the object in the tree
/*
  <TabState>  // tab level state, starts shared worker
  <SyncPath path={ } fallback={loading}> // support suspense
    <Editor>  // editor level state
        <Sync>
    </Editor>
  </SyncPath>
  </TabState>
*/

type InputString = string | (() => string)

export const TabStateContext = createContext<TabStateValue>()
export function useSync() { return useContext(TabStateContext) }

// all this does is make available the connection to the shared worker.

class DocBuf implements LensApi {
  _ds: OmState
  _peer = new OmPeer()
  _ul = new Listener()
  constructor(json: OmStateJson, public api: LensApi) {
    this._ds = new OmState(json)
  }
  close() {
    this.api.close()
  }
  update(ops: Op[]) {
    for (let o of ops) {
      this._peer.merge_op(this._ds, o)
    }
    this._ul.notify()
  }
  registerUpdateListener(f: () => void) {
    this._ul.add(f)
  }
}
export class TabStateValue {
  sw = new SimpleWorker()
  api: Peer<ServiceApi>

  constructor() {
    this.api = new Peer(new WorkerChannel(this.sw.port))
  }

  async load(path: string): Promise<DocBuf> {
    const mc = new MessageChannel()
    const json = await this.api.rpc<OmStateJson>("open", [path, mc.port2], [mc.port2])
    const wc = new WorkerChannel(mc.port1)
    const db = new DocBuf(json, lensApi(wc))

    apiListen<LensApi>(wc, db)
    return db
  }

}
export function TabState(props: { children: JSXElement }) {
  const u = new TabStateValue()
  return <TabStateContext.Provider value={u}>
    {props.children}
  </TabStateContext.Provider>
}

export const SyncPathContext = createContext<DocBuf>()
export function useSyncPath() { return useContext(SyncPathContext) }

export function SyncPath(props: { path: InputString, fallback: JSXElement, children: JSXElement }) {
  const prov = useSync()!
  const ars = async (path: string) => { return await prov.load(path) }
  const [rs] = createResource(props.path, ars)
  onCleanup(() => { rs()?.close() })

  return <SyncPathContext.Provider value={rs()}>
    <Show fallback={props.fallback} when={!rs.loading}>{props.children}</Show>
  </SyncPathContext.Provider>
}

export interface JsonNode {
  parent?: string
  type: string
  prev?: string
  text?: string
  [key: string]: any
}

// replace with quill pieces

// when the server sends a node, we will create it in lex, wrap it in a om node and create a map for lex node to om
class DocBuffer {
  obj = new OmState({})
  lex = new Map<string, LexicalNode>()

  constructor(public key: Accessor<string | undefined>,
    public version: Accessor<number>, public api: Accessor<LensApi | undefined>) {

  }

}
export function SimpleSync() {
  const st = useSyncPath()
  if (!st) return null
  const [editor] = useLexicalComposerContext()

  const fromLexical = (a: LexicalNode | null) : JsonNode|null => {
    if (!a) return a
    const r: JsonNode = {
      type: a.getType(),
      parent: a.getParent()?.getKey(),
      prev: a.getPreviousSibling()?.getKey(),
    }

    if (a instanceof TextNode) {
      r.text = a.__text
      r.format = a.__format
      r.mode = a.__mode
      r.style = a.__style
    }
    return r
  }

  const $getDirty = (
    dirtyElements: string[],
    editorState: EditorState,
    prevEditorState: EditorState) => {

    let now = new Map<string, JsonNode>()
    let prev = new Map<string, JsonNode>()
    editorState.read(() => {
      for (let k of dirtyElements) {
        const a = fromLexical($getNodeByKey(k))
        if (a) now.set(k, a)
      }
    })
    prevEditorState.read(() => {
      for (let k of dirtyElements) {
        const a = fromLexical($getNodeByKey(k))
        if (a) prev.set(k, a)
      }
    })

    return { now, prev }
  }

  onMount(async () => {
    // every update will increase the version, we ignore versions greater than 1 that are less than the current version number. 
    st.registerUpdateListener(()=>{

    })
    editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {

        const dirty = [...dirtyElements.keys(), ...dirtyLeaves.keys()]
        //const { now, prev } = $getDirty(dirty, editorState, prevEditorState)

        // to convert to ops we need to determine the node's parent 

        let ops: Op[] = []
        st.update(ops)
      })

  })

  return <></>
}
