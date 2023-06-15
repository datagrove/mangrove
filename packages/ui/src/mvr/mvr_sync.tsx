import { JSXElement, Show, createContext, createResource, onCleanup, onMount, useContext } from "solid-js"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { $createRangeSelection, $getNodeByKey, $getRoot, $getSelection, ElementNode, GridSelection, LexicalEditor, LexicalNode, NodeSelection, RangeSelection, RootNode, TextNode } from "lexical"
import { Peer, WorkerChannel, apiListen } from "../abc/rpc"
import { LensApi, LensServerApi, lensServerApi, DgSelection, DgRangeSelection, KeyMap, ServiceApi, topologicalSort } from "./mvr_shared"
import { DgElement as DgElement } from "./mvr_shared"

import LocalState from './mvr_worker?sharedworker'
import { PeerServer } from "./mvr_worker"
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
export class DocBuffer  {
  _id?: DgElement[] // only used for initializing.
  _editor?: LexicalEditor

  constructor(public api: LensServerApi, id: DgElement[]) {
    this._id = id
  }

  // recursive over children; are we clever enough to not repeat here though?
  // maybe we need a set of visited ids? how do we set lexical parents?
  // how to deal with text nodes? know when to stop?
  // coming from the server all the children are strings, not nodes.

  // assumes all children created first. assumes we are creating from scratch, not update.
  // must call inside editor context
  $updateProps(m: Map<string,LexicalNode>, um : [string, string][], v: DgElement, ln: LexicalNode | null) {
    let nodeInfo = this._editor?._nodes.get(v.type);
    if (!nodeInfo) {
      nodeInfo = this._editor?._nodes.get("text");
    }
    let nl  = new nodeInfo!.klass() as TextNode
    if (!nl) {
      throw new Error("can't create node for " + v.type)
    } 
    // copy the properties to the new node
    const vx = v as any
    nl.__text = vx.text
    nl.__format = vx.format
    nl.__mode = vx.mode
    nl.__style = vx.style

    m.set(v.id, nl)
    for (let c of v.children ?? []) {
      // getNodeByKey doesn't work here if we just created the node.
      let n = m.get(c) || $getNodeByKey(c) 
      if (!n) {
        throw new Error(`missing child, sort failed parent ${v.id} child ${c}`)
      }
      nl.append(n)
    }
    console.log("up", ln, nl)
    if (ln) {
      ln.replace(nl)
    } else {
      console.log("ins", v.id, nl.getKey())
      um.push([v.id, nl.getKey()])
    }
    // the last node in the array is the root, how do we replace that?
    // why are nodes creating dom when they are not connected to the root?
    return nl
  }
  // return the keys for every element created
  // with upd and del the id is already the lex key
  // with ins the id is the mvr key, create the lex key and return the pair.
  // we need to top sort this to make sure children are created before parents?
  // then we need to sync the children and the properties.
  async update(upd: DgElement[], del: string[], selection: DgSelection | null): Promise<[string, string][]> {
    const um: [string, string][] = []
    const m = new Map<string, LexicalNode>()
    this._editor?.update(() => {
      del.forEach(d => { $getNodeByKey(d)?.remove() })
      upd.forEach(u => { this.$updateProps(m, um, u, $getNodeByKey(u.id)) })
      const sel = $getSelection()
      const selr = $createRangeSelection()
      //$setSelection(null)
    })
    return um
  }


  // what about making the initial document into an insert?
  // there would be

  async subscribe(editor: LexicalEditor) {
    this._editor = editor
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
            type: a.getType(),
            children: en?.getChildrenKeys() ?? [],
          }

          if (a instanceof TextNode) {
            let rx = r as any
            rx.text = a.__text
            rx.format = a.__format
            rx.mode = a.__mode
            rx.style = a.__style
          }
          return r
        }
        const dirty = [...dirtyElements.keys(), ...dirtyLeaves.keys()]
        let upd: DgElement[] = []
        let del: string[] = []
        editorState.read(() => {
          for (let k of dirty) {
            const a = fromLexical($getNodeByKey(k))
            if (a) upd.push(a)
            else del.push(k)
          }
        })
        //this.api.update(upd, del, { start: 0, end: 0 })
      })
      

      // build the document and return the keymap
      // _id was already retrieved by open.
      const um: [string, string][] = []
      editor.update(() => {
        console.log("subscribe", this._id)
        const m = new Map<string, LexicalNode>()
        const [doc,id] = topologicalSort(this._id ?? [])
        let nl: LexicalNode | null = null
        const mr = doc[doc.length - 1]
        const root = $getRoot() as RootNode
        for (let i of mr.children ?? []) {
          const v = id[i]
          root.append(this.$updateProps(m,um, v, null))
        }
      })
      this._id = undefined
      console.log("subscribe end", um)
      //await this.api.subscribe(um)
  }
}



export const TabStateContext = createContext<TabStateValue>()
export function useSync() { return useContext(TabStateContext) }

// all this does is make available the connection to the shared worker.



export class TabStateValue {
  
  api!: Peer

  makeWorker() {
    const sw = new LocalState()
    sw.port.start()
    this.api = new Peer(new WorkerChannel(sw.port))
  }
  makeLocal() {
    const ps = new PeerServer()
    const mc = new MessageChannel()
    this.api = new Peer(new WorkerChannel(mc.port1))

    const svr = new Peer(new WorkerChannel(mc.port2))
    const r : ServiceApi = {
      open: ps.open.bind(ps),
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
      update: db.update.bind(db),
    }
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

export function SyncPath(props: { path: string|(()=>string), fallback: JSXElement, children: JSXElement }) {
  const prov = useSync()!
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