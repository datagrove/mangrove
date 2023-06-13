import { Accessor, JSXElement, Show, createContext, createEffect, createSignal, onCleanup, useContext } from "solid-js"
import SimpleWorker from './simple_worker.ts?sharedworker'
import { DocState, OmPeer, Op } from "./om"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { $getNodeByKey, $getRoot, $parseSerializedNode, ElementNode } from "lexical"
import { Channel, Listener, WorkerChannel, apiListen } from "../abc/rpc"
import { BufferApi, bufferApi } from "./simple_worker"
import { ServiceApi } from "./simple_sync_shared"
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

  open(path: string) : MessagePort {
    const mc = new MessageChannel()
    this.sw.port.postMessage({method: "open", params: [mc.port2,path]}, [mc.port2])
    return mc.port1
  }
    
  constructor() {
   
  }
}

export function TabState(props: { children: JSXElement }) {
  const u = new TabStateValue()
  return <TabStateContext.Provider value={u}>
        {props.children}
    </TabStateContext.Provider>
}


export const SyncPathContext = createContext<DocBuffer>()
export function  useSyncPath () { return useContext(SyncPathContext) }



// loading signal?
class DocBuffer {
  ds = new DocState()
  //listener = new Listener()

  constructor(public key: Accessor<string|undefined>,
    public version: Accessor<number>) {

  }
}

export function SyncPath(props: {path: InputString, fallback: JSXElement, children: JSXElement}) {
  const prov = useSync()!
  const [key, setKey] = createSignal<string>()
  const [ch,setCh] = createSignal<Channel>()
  const [ver, setVer] = createSignal(0)

  let ds = new DocBuffer(key,ver)
  const closeKey = () => {
      ch()?.close()
  }
  onCleanup(() => {
    closeKey()
  })

  // manage the key
  if (typeof props.path == "string") {
    setKey(props.path)
  } else{
    createEffect(() => {
      closeKey()
      setKey((props.path as ()=>string)())
    })
  }

  let oldkey = ""
  createEffect(() => {
    // run every time the key changes.
    // create a new channel and listen to it.
    if (!key() || key()==oldkey) return
    oldkey = key()!
    ds.ds = new DocState()
    const peer = new OmPeer()
    const mp = prov.open(key()!)
    const ch = new WorkerChannel(mp)
    
    setCh(ch)
    apiListen<BufferApi>(ch,{
      update: function (ops: Op[]): void {
        for (let o of ops) {
          peer.merge_op(ds.ds, o)
        }
      }
    })
  })

  return <SyncPathContext.Provider value={ds}>
    <Show fallback={props.fallback} when={ver()!=0}>{props.children}</Show>
    </SyncPathContext.Provider>
}

class BufferProviderx {
   ds = new DocState()
   peer = new OmPeer() 
   
   constructor() {
      
   }
}

export const BufferContext = createContext<BufferProviderx>()
export function  useBuffer () { return useContext(BufferContext) }

export function BufferProvider(props: { children: JSXElement }) {
  const bp = new BufferProviderx()
  return <BufferContext.Provider value={bp}>
        {props.children}
    </BufferContext.Provider>
}


export function SimpleSync() {
    const b = useBuffer()
    if (!b) return null  // deactivate if not in Sync context
    const [editor] = useLexicalComposerContext()
  
    const listen = (update: Op[]) => { 
      console.log("update", update)
    }
    
  
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
  