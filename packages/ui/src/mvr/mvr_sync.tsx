import { Accessor, JSXElement, Show, createContext, createEffect, createResource, createSignal, onCleanup, onMount, useContext } from "solid-js"
import SimpleWorker from './simple_worker.ts?sharedworker'
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { $getNodeByKey, $getRoot, $getSelection, $parseSerializedNode, $setSelection, EditorState, ElementNode, GridSelection, LexicalEditor, LexicalNode, NodeKey, NodeSelection, RangeSelection, TextNode } from "lexical"
import { Channel, Listener, Peer, WorkerChannel, apiListen } from "../abc/rpc"
import { LensApi, LensServerApi, Op, ServiceApi, DgDoc, lensApi, lensServerApi, serviceApi, DgSelection } from "./mvr_shared"
import { DgElement as DgElement } from "./mvr_shared"

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
  _id: DgDoc
  _editor?: LexicalEditor

  constructor(public api: LensServerApi, id: DgDoc) {
    this._id = id
  }


  // return the keys for every element created
      // with upd and del the id is already the lex key
    // with ins the id is the mvr key, create the lex key and return the pair.
 update(op: Op[], selection: DgSelection) : [string, string][] {
    let um: [string, string][] = []

    const ins = (v: DgElement) => {
      const nodeInfo = this._editor?._nodes.get(v.class);
      if (!nodeInfo) {
        return
      }

      let ln = new nodeInfo.klass();
      um.push([v.id, ln.getKey()])
      // recursive over children.
    }

    this._editor?.update(() => {
      for (let o of op) {
        switch (o.op) {
          case "ins":
            ins(o.v)
            break;
          case "upd":
            $getNodeByKey(o.v.id)
            break;
          case "del":
            $getNodeByKey(o.id)?.remove()
            break;
        }

      }
      $setSelection(selection)
    })
    return um
}

  subscribe(editor: LexicalEditor) {
    this._editor = editor
    this.api.subscribe()
    editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {

        const fromLexical = (a: LexicalNode | null): DgElement | null => {
          if (!a) return a
          const en = a instanceof ElementNode? a as ElementNode : null
          const r: DgElement = {
            id: a.getKey(),
            parent: a.getParent()?.getKey(),
            v: 0,
            conflict: "",
            tagName: a.getType(),
            class: "",
            children: en?.getChildrenKeys()??[] ,
          }

          if (a instanceof TextNode) {
            r.text = a.__text
            r.format = a.__format
            r.mode = a.__mode
            r.style = a.__style
          }
          return r
        }

        const sel = $getSelection()
        const dirty = [...dirtyElements.keys(), ...dirtyLeaves.keys()]

        let now: (DgElement|string)[] = []
      
        editorState.read(() => {
          for (let k of dirty) {
            const a = fromLexical($getNodeByKey(k))
            if (a) now.push(a)
            else now.push(k)
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

        this.api.update( now, sel)
      })

  }
}






type InputString = string | (() => string)

export const TabStateContext = createContext<TabStateValue>()
export function useSync() { return useContext(TabStateContext) }

// all this does is make available the connection to the shared worker.

export class TabStateValue {
  sw = new SimpleWorker()
  api: Peer<ServiceApi>

  constructor() {
    this.api = new Peer(new WorkerChannel(this.sw.port))
  }

  async load(path: string): Promise<DocBuffer> {
    const mc = new MessageChannel()
    const json = await this.api.rpc<DgDoc>("open", [path, mc.port2], [mc.port2])
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