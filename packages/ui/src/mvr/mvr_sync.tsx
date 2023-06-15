import { JSXElement, Show, createContext, createResource, onCleanup, onMount, useContext } from "solid-js"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { $createRangeSelection, $getNodeByKey, $getSelection, ElementNode, GridSelection, LexicalEditor, LexicalNode, NodeSelection, RangeSelection, TextNode } from "lexical"
import { Peer, WorkerChannel, apiListen } from "../abc/rpc"
import { LensApi, LensServerApi, lensServerApi, DgSelection, DgRangeSelection, KeyMap } from "./mvr_shared"
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
function topologicalSort(elements: DgElement[]): DgElement[] {
  console.log("elements", elements)
  const id: { [id: string]: DgElement } = {};
  const visited: { [id: string]: boolean } = {};
  const sorted: DgElement[] = [];

  for (const element of elements) {
      id[element.id] = element;
  }

  const visit = (element: DgElement) => {
      if (visited[element.id]) {
          return;
      }
      visited[element.id] = true;
      for (const childId of element.children) {
          const child = id[childId]
          if (child) {
              visit(child);
          } else {
              throw new Error(`child ${childId} not found`)
          }
      }
      sorted.push(element);
  };

  for (const element of elements) {
      visit(element);
  }
  console.log("sorted", sorted)
  return sorted;
}

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


  updateProps(um : [string, string][], v: DgElement, ln: LexicalNode | null) {
    console.log("updateProps", v, ln)
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
      um.push([v.id, nl.getKey()])
    }

  }
  // return the keys for every element created
  // with upd and del the id is already the lex key
  // with ins the id is the mvr key, create the lex key and return the pair.
  // we need to top sort this to make sure children are created before parents?
  // then we need to sync the children and the properties.
  async update(upd: DgElement[], del: string[], selection: DgSelection | null): Promise<[string, string][]> {
    const um: [string, string][] = []
    this._editor?.update(() => {
      del.forEach(d => { $getNodeByKey(d)?.remove() })
      upd.forEach(u => { this.updateProps(um, u, $getNodeByKey(u.id)) })
      const sel = $getSelection()
      const selr = $createRangeSelection()
      //$setSelection(null)
    })
    return um
  }


  // what about making the initial document into an insert?
  // there would be

  async subscribe(editor: LexicalEditor) {
    console.log("subscribe")
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
        let upd: DgElement[] = []
        let del: string[] = []
        editorState.read(() => {
          for (let k of dirty) {
            const a = fromLexical($getNodeByKey(k))
            if (a) upd.push(a)
            else del.push(k)
          }
        })
        this.api.update(upd, del, { start: 0, end: 0 })
      })

          // build the document and return the keymap
    // _id was already retrieved by open.
      const um: [string, string][] = []
      for (let v of this._id ?? []) {
        this.updateProps(um, v, null)
      }
      await this.api.subscribe(um)
  }
}



export const TabStateContext = createContext<TabStateValue>()
export function useSync() { return useContext(TabStateContext) }

// all this does is make available the connection to the shared worker.

export class TabStateValue {
  sw = new LocalState()
  api: Peer

  constructor() {
    this.sw.port.start()
    this.sw.port.postMessage({ type: "init" })
    this.api = new Peer(new WorkerChannel(this.sw.port))
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