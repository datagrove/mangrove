import { Accessor, JSXElement, Show, createContext, createEffect, createResource, createSignal, onCleanup, onMount, useContext } from "solid-js"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { $createRangeSelection, $getNodeByKey, $getRoot, $getSelection, $parseSerializedNode, $setSelection, EditorState, ElementNode, GridSelection, LexicalEditor, LexicalNode, NodeKey, NodeSelection, RangeSelection, TextNode } from "lexical"
import { Channel, Listener, Peer, WorkerChannel, apiListen } from "../abc/rpc"
import { LensApi, LensServerApi, Op, ServiceApi, lensApi, lensServerApi, serviceApi, DgSelection, KeyMap } from "./mvr_shared"
import { DgElement as DgElement } from "./mvr_shared"

import LocalState from './mvr_worker?sharedworker'
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
export class DocBuffer implements LensApi {
  _id?: DgElement[] // only used for initializing.
  _editor?: LexicalEditor

  constructor(public api: LensServerApi, id: DgElement[] ) {
    this._id = id
  }

  um: [string, string][] = []

    // recursive over children; are we clever enough to not repeat here though?
    // maybe we need a set of visited ids? how do we set lexical parents?
    // how to deal with text nodes? know when to stop?
    // coming from the server all the children are strings, not nodes.

    // assumes all children created first. assumes we are creating from scratch, not update.

 
   updateProps(v: DgElement, ln: LexicalNode | null) {
      const nodeInfo = this._editor?._nodes.get(v.class);
      if (!nodeInfo) {
        return
      }
      let nl = new nodeInfo.klass();
      if (!nl) return
      for (let c of v.children ?? []) {
        const n = $getNodeByKey(c)
        if (n) {
          nl.append(n)
        }
      }
      if (ln) {
        ln.replace(nl)
      } else {
        this.um.push([v.id, nl.getKey()])
      }
  }
  // return the keys for every element created
  // with upd and del the id is already the lex key
  // with ins the id is the mvr key, create the lex key and return the pair.
  // we need to top sort this to make sure children are created before parents?
  // then we need to sync the children and the properties.
  async update(upd: DgElement[], del: string[], selection: DgSelection|null): Promise<[string, string][]> {
    this.um = []
    this._editor?.update(() => {
      del.forEach(d => { $getNodeByKey(d)?.remove() })
      upd.forEach(u => { this.updateProps(u, $getNodeByKey(u.id)) })
      const sel = $getSelection()
      const selr = $createRangeSelection()
      //$setSelection(null)
    })
    return this.um
  }


  // what about making the initial document into an insert?
  // there would be

  subscribe(editor: LexicalEditor) {
    this._editor = editor
    // build the document and return the keymap
    // _id was already retrieved by open.
    this.um = []
    for (let v of this._id ?? []) {
      this.updateProps(v, null)
    }
    this.api.subscribe(this.um)

    editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {

        const fromLexical = (a: LexicalNode | null): DgElement | null => {
          if (!a) return a
          const en = a instanceof ElementNode ? a as ElementNode : null
          const r: DgElement = {
            id: a.getKey(),
            parent: a.getParent()?.getKey(),
            v: 0,
            conflict: "",
            tagName: a.getType(),
            class: "",
            children: en?.getChildrenKeys() ?? [],
          }

          if (a instanceof TextNode) {
            r.text = a.__text
            r.format = a.__format
            r.mode = a.__mode
            r.style = a.__style
          }
          return r
        }
        const dirty = [...dirtyElements.keys(), ...dirtyLeaves.keys()]
        let upd: DgElement [] = []
        let del: string[] = []
        editorState.read(() => {
          for (let k of dirty) {
            const a = fromLexical($getNodeByKey(k))
            if (a) upd.push(a)
            else del.push(k)
          }
        })
        // let prev: DgElement[] = []
        // prevEditorState.read(() => {
        //   for (let k of dirty) {
        //     const a = fromLexical($getNodeByKey(k))
        //     if (a) prev.push(a)
        //   }
        // })

        // to convert to ops we need to determine the node's parent 
        const sel = $getSelection()
        const dgSel: DgSelection = {

        }
        this.api.update(upd,del, dgSel)
      })

  }
}






type InputString = string | (() => string)

export const TabStateContext = createContext<TabStateValue>()
export function useSync() { return useContext(TabStateContext) }

// all this does is make available the connection to the shared worker.

export class TabStateValue {
  sw = new LocalState()
  api: Peer<ServiceApi>

  constructor() {
    this.api = new Peer(new WorkerChannel(this.sw.port))
  }

  async load(path: string): Promise<DocBuffer> {
    const mc = new MessageChannel()
    const json = await this.api.rpc<DgElement[]>("open", [path, mc.port2], [mc.port2])
    const wc = new WorkerChannel(mc.port1)
    const db = new DocBuffer(lensServerApi(wc), json)

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

export const SyncPathContext = createContext<DocBuffer>()
export function useSyncPath() { return useContext(SyncPathContext) }

export function SyncPath(props: { path: InputString, fallback: JSXElement, children: JSXElement }) {
  const prov = useSync()!
  const ars = async (path: string) => { return await prov.load(path) }
  const [rs] = createResource(props.path, ars)
  onCleanup(() => { rs()?.api.close() })

  return <SyncPathContext.Provider value={rs()}>
    <Show fallback={props.fallback} when={!rs.loading}>{props.children}</Show>
  </SyncPathContext.Provider>
}

export function Sync() {
  const st = useSyncPath()
  if (!st) return null
  const [editor] = useLexicalComposerContext()

  onMount(async () => {
    st.subscribe(editor)
  })

  return <></>
}

type LexSelection = null | RangeSelection | NodeSelection | GridSelection