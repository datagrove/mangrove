import { Accessor, JSXElement, Show, createContext, createEffect, createSignal, onCleanup, onMount, useContext } from "solid-js"
import SimpleWorker from './simple_worker.ts?sharedworker'
import { DocState, OmPeer, Op } from "./om"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { $getNodeByKey, $getRoot, $parseSerializedNode, EditorState, ElementNode, LexicalNode, NodeKey, TextNode } from "lexical"
import { Channel, Listener, WorkerChannel, apiListen } from "../abc/rpc"
import { LensApi, ServiceApi, lensApi } from "./simple_sync_shared"
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

type InputString = string | (()=>string)

export const TabStateContext = createContext<TabStateValue>()
export function  useSync () { return useContext(TabStateContext) }

// all this does is make available the connection to the shared worker.
export class TabStateValue {
  sw = new SimpleWorker()
}
export function TabState(props: { children: JSXElement }) {
  const u = new TabStateValue()
  return <TabStateContext.Provider value={u}>
        {props.children}
    </TabStateContext.Provider>
}

export const SyncPathContext = createContext<DocBuffer>()
export function  useSyncPath () { return useContext(SyncPathContext) }
class OmElement {
    ds = new  OmState()

}
class DocBuffer {

  // map from lex
  obj = new Map<NodeKey, OmElement>()
  // map from om



  constructor(public key: Accessor<string|undefined>,
    public version: Accessor<number>, public api: Accessor<LensApi|undefined>) {

  }
}

export function SyncPath(props: {path: InputString, fallback: JSXElement, children: JSXElement}) {
  const prov = useSync()!
  const [path, setPath] = createSignal<string>()
  const [ch,setCh] = createSignal<Channel>()
  const [ver, setVer] = createSignal(0)
  const [api, setApi] = createSignal<LensApi>()

  let ds = new DocBuffer(path,ver,api)
  const closeKey = () => {
      ch()?.close()
  }
  onCleanup(() => {
    closeKey()
  })

  // manage the key
  if (typeof props.path == "string") {
    setPath(props.path)
  } else{
    createEffect(() => {
      closeKey()
      setPath((props.path as ()=>string)())
    })
  }

  let oldpath = ""
  createEffect(() => {
    // run every time the key changes.
    // create a new channel and listen to it.
    if (!path() || path()==oldpath) return
    oldpath = path()!
 
    const peer = new OmPeer()
    const mc = new MessageChannel()
    prov.sw.port.postMessage({method: "open", params: [path(), mc.port2]}, [mc.port2])
    const ch = new WorkerChannel(mc.port1)
    setCh(ch)
    setApi(lensApi(ch))
    apiListen<LensApi>(ch,{
      update: function (ops: Op<any>[]): void {
        for (let o of ops) {
          let objo = ds.objo.get(o.key)
          if (!objo) {
            objo = new OmElement()
            ds.objo.set(o.key, objo)
          }
          peer.merge_op(objo.ds, o)
          setVer(ver()+1)
        }
      }
    })
  })

  return <SyncPathContext.Provider value={ds}>
    <Show fallback={props.fallback} when={ver()!=0}>{props.children}</Show>
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

export function SimpleSync() {
    const b = useSyncPath()
    if (!b) return null  // deactivate if not in Sync context
    const [editor] = useLexicalComposerContext()

    const  fromLexical = (a: LexicalNode | null) => {
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

    // If a new element is created, we need to 
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
        editor.registerUpdateListener(
        ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {
          
          const dirty = [...dirtyElements.keys(), ...dirtyLeaves.keys()]
          //const { now, prev } = $getDirty(dirty, editorState, prevEditorState)

          // to convert to ops we need to determine the node's parent 

          let ops: Op<any>[] = []
          b.api()?.update(ops)
        })
      
    })
  
    return <></>
  }
  