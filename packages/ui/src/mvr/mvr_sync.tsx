import { Accessor, JSXElement, Show, createContext, createEffect, createResource, createSignal, onCleanup, onMount, useContext } from "solid-js"
import SimpleWorker from './simple_worker.ts?sharedworker'
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { $getNodeByKey, $getRoot, $getSelection, $parseSerializedNode, $setSelection, EditorState, ElementNode, GridSelection, LexicalEditor, LexicalNode, NodeKey, NodeSelection, RangeSelection, TextNode } from "lexical"
import { Channel, Listener, Peer, WorkerChannel, apiListen } from "../abc/rpc"
import { LensApi, LensServerApi, Op, ServiceApi, SimpleDoc, lensApi, lensServerApi, serviceApi } from "./mvr_shared"
import { SimpleElement as DgElement } from "./mvr_shared"

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
  _id: SimpleDoc
  _editor?: LexicalEditor

  constructor(public api: LensServerApi, id: SimpleDoc) {
    this._id = id
  }

  update(ops: Op[]): void {
    // for (let o of ops) {
    //   if (o.op === "upd") {
    //     this.id[o.v.id] = o.v
    //   } else {
    //     delete this.id[o.v.id]
    //   }
    // }
  }
  close(): void {
   
  }

  subscribe(editor: LexicalEditor) {
    this._editor = editor



  // with inserts we can create recursively.

  // with upd and del the id is already the lex key
  // with ins the id is the mvr key, create the lex key and return the pair.
  const updateFromWorker = (op: Op[], selection: LexSelection) => {
    let um: [string, string][] = []

    const ins = (v: DgElement) => {
      const nodeInfo = editor._nodes.get(v.class);
      if (!nodeInfo) {
        return
      }

      let ln = new nodeInfo.klass();
      um.push([v.id, ln.getKey()])
      // recursive over children.
    }

    // return the keys for every element created

    editor.update(() => {
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

    editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {

        const fromLexical = (a: LexicalNode | null): DgElement | null => {
          if (!a) return a
          const r: DgElement = {
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


        const sel = $getSelection()
        const dirty = [...dirtyElements.keys(), ...dirtyLeaves.keys()]

    
        let now = new Map<string, DgElement>()
        let prev = new Map<string, DgElement>()
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
    
        // to convert to ops we need to determine the node's parent 

        let ops: Op[] = []
        this.api.update(ops)
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
    const json = await this.api.rpc<SimpleDoc>("open", [path, mc.port2], [mc.port2])
    const wc = new WorkerChannel(mc.port1)
    const db = new DocBuffer(lensServerApi(wc),json)

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
  onCleanup(() => { rs()?.close() })

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