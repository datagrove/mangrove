import { LexicalNode, EditorState, $getNodeByKey, TextNode, $createParagraphNode, SerializedLexicalNode, $parseSerializedNode, $getRoot, ElementNode } from "lexical"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { JSXElement, Show, createContext, createEffect, createSignal, onCleanup, onMount, useContext } from "solid-js"
import { Position } from "postcss"
import { BufferApi, JsonPatch, PositionMap, PositionMapPatch } from "./sync_shared"


/*
   <SyncProvider>  // tab level state, starts shared worker
     <SyncPath path={ } fallback={loading}> // support suspense
        <Editor>  // editor level state
           <Sync>
        </Editor>
      </SyncPath>
    </SyncProvider>
*/


// there a two types of patches: "/node" and "/node/prop"

// do I need tab level state? how expensive is it to create a shared worker?

type PatchListener = (p:JsonPatch[]|string, version: number, pos: PositionMapPatch)=>void



export interface SyncProvider {
  open(onChange: PatchListener): BufferApi
  close(l: BufferApi): void
}

export const SyncContext = createContext<SyncProvider>()
export function  useSync () { return useContext(SyncContext) }

// json patch works, but rebasing could be a challenge
// seems like we need to keep a offsetview on each device.
// when we accept a patch we need to create a position map we can use to update our selections
// localState accepts a patch, but then it

// assume we get rid of buffers completely. 

// JsonPatchable is the model we are assuming It is a tree of nodes, each node has a type and a set of properties.

export interface JsonNode {
  parent?: string
  type: string
  prev?: string
  text?: string
  [key: string]: any
}


// not all properties should be synced. we should allow registering a node type and a way to sync it.
const registry = new Map<string, (n: LexicalNode) => JsonNode>()
export function registerNodeType(type: string, f: (n: LexicalNode) => JsonNode) {
  registry.set(type, f)
}

export const VOID = null as any as void

function propDiff(n: string, prev: JsonNode, now: JsonNode) : JsonPatch[]{
  const o : JsonPatch[] = []
  const nowx = now as any
  const prevx = prev as any

  for (let k of Object.keys(now)) {
    if (nowx[k] != prevx[k]) {
      o.push({
        op: "replace",
        path: `${n}/${k}`,
        value: nowx[k]
      })
    }
  }
  for (let k of Object.keys(prev)) {
    if (nowx[k]!=prevx[k] && !nowx[k]) {
      o.push({
        op: "remove",
        path: `${n}/${k}`
      })
    }
  }
  //console.log("propdiff", n, prev, now,o)
  return o
}

function fromLexical(a: LexicalNode | null) {
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

function diff(prev: Map<string, JsonNode>, now: Map<string, JsonNode>) : JsonPatch[]{
  const o : JsonPatch[] = []
  for (let [k, now1] of now) {
    let prev1 = prev.get(k)
    //console.log("diff", k, prev1, now1)
    if (!prev1 && now1) {
      // insert
      o.push({
        op: "add",
        path: k,
        value: now1,
      })
    } else if (prev1 && !now1 ) {
      // delete
      o.push({
        op: "remove",
        path: k,
        value: now1,
      })
    } else if (now1 && prev1) {
      o.push(...propDiff(k, prev1, now1))
    }
  }
  return o
}

export function $getDirty(
  dirtyElements: string[],
  editorState: EditorState,
  prevEditorState: EditorState) {

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

export function sync(onChange: (diff: JsonPatch[]) => void) {
  const [editor] = useLexicalComposerContext();


}

// this seems awkward, but apparently we need to replace all the nodes?

// not a true json patch? maybe make every reference symbolic? or do we want to follow paths?
// if we follow paths, we don't need gid at all; just start at the root.
//

// get a sloppy diff of the editor state and send it to a worker
// the worker will async merge it however it wants, then send back a diff
// if more changes happen, this diff is ignored. otherwise it is applied.
    // we need to map the children somehow to move them back and forth to the worker.
  // try sending the entire top level child;
    // we might need to rescue our selection; if an anchor node is deleted, we need to find the next node. We could potentially make the instigator recover all the selections?
    // we could create a position map as we update, then use this plus an offset view.
    // can we force the editor to start an update cycle so we know we have all the latest states?
    // is this a good idea?

// we might need to break this into another provider component so we can support suspense correctly. each time the path changes we need to trigger suspense.

class SyncPort {
  version = createSignal(0)
  listen = new Set<PatchListener>()
  constructor(public api: BufferApi){

  }

  // it's not clear we can or want to support multiple editors here, so addListener may be misleading. Potentially other things could listen, but each editor has its own unique node ids, so two editors won't simply work. To support this case create another provider on the same path. The main reason we even have this wrapper is to support suspense.
  addListener(p: PatchListener) {
    this.listen.add(p)
  }
  removeListener(p: PatchListener) {
    this.listen.delete(p)
  }
}
const PathProvider = createContext<SyncPort>()
export function useSyncPort () {
  return useContext(PathProvider)
}
type InputString = string | (()=>string)

export function SyncPath(props: {path: InputString, fallback: JSXElement, children: JSXElement}) {
  const prov = useSync()!

  //const [myversion, setMyVersion] = createSignal(0)


  // every time the path changes we need to go back to the loading state.
  let port: SyncPort
  const listen = (diff: JsonPatch[]|string, version: number, pm: PositionMapPatch) => {
    port.version[1](version)
    for (let p of port.listen) {
      p(diff, version, pm)
    }
  }
  const api = prov.open(listen)
 port = new SyncPort(api)

  onCleanup(() => {
    prov.close(port.api)
  })

  const mypath = ""
  if (typeof props.path == "string") {
    port.api.setPath(props.path)
  } else {
    createEffect(() =>{
      const pth = (props.path as ()=>string)()
      if (pth != mypath) {
        port.api.setPath((props.path as ()=>string)())
        port.version[1](0)
      }     
    })
  }
  return <PathProvider.Provider value={port}>
    <Show fallback={props.fallback} when={port.version[0]()!=0}>{props.children}</Show>
    </PathProvider.Provider>
}

export function Sync() {
  const port = useSyncPort()
  if (!port) return null  // deactivate if not in Sync context

  const pm = new PositionMap()
  const [editor] = useLexicalComposerContext()

  const listen = (diff: JsonPatch[]|string, version: number, pm: PositionMapPatch) => {
    if (version == 0){
      editor.update(()=>{       
        const editorState = editor.parseEditorState(diff as string)
        editor.setEditorState(editorState);
      }) 
    } else {
      // there will be another version along shortly, so we can ignore this one.
      if (version != port.version[0]()) {
        return
      }
      editor.update(() => {
        const registeredNodes = editor._nodes; 
        for (let o of diff as JsonPatch[]) {
          switch(o.op) {
            case "add":
              
              const n = o.value as SerializedLexicalNode
              // I doubt it has a node id here? how would we get it then?
              const ln = $parseSerializedNode(n)
              const r : ElementNode = $getRoot()
              r.insertChild(ln, o.path)
              break
            case "remove":
                $getNodeByKey(o.path)?.remove()
              break
            case "replace":
              $getNodeByKey(o.path)?.replace(o.value)
              break
          }
        }
      })      
    }
  }
  port.addListener(listen)

  onMount(async () => {

     // every update will increase the version, we ignore versions greater than 1 that are less than the current version number. 
      editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {

        const dirty = [...dirtyElements.keys(), ...dirtyLeaves.keys()]
        const { now, prev } = $getDirty(dirty, editorState, prevEditorState)
        const v = port.version[0]()+1
        port.version[1](v)
        port.api.propose(diff(prev, now), v)

      })
    
  })

  return <></>
}
