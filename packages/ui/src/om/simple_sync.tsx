import { JSXElement, createContext, createSignal, useContext } from "solid-js"
import SimpleWorker from './simple_worker.ts?sharedworker'
import { DocState, OmPeer, Op } from "./om"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { $getNodeByKey, $getRoot, $parseSerializedNode, ElementNode } from "lexical"
import { WorkerChannel } from "../abc/rpc"
import { BufferApi, bufferApi } from "./simple_worker"
import { ServiceApi } from "./simple_sync_shared"

type InputString = string | (()=>string)

 class SyncProviderx {
  sw = new SimpleWorker()
  api: ServiceApi
  constructor() {
     const w = new WorkerChannel(this.sw.port)
     this.api = bufferApi(w)
  }
}

export const SyncContext = createContext<SyncProviderx>()
export function  useSync () { return useContext(SyncContext) }

class Listener {
  listen = new Set<()=>void>()
  add(p: ()=>void) {
    this.listen.add(p)
  }
  remove(p: ()=>void) {
    this.listen.delete(p)
  }
  notify() {
    for (let p of this.listen) {
      p()
    }
  }
}

class SyncPort {
  listener = new Listener()
  version = createSignal(0)
  constructor(public api: BufferApi){

  }

  // it's not clear we can or want to support multiple editors here, so addListener may be misleading. Potentially other things could listen, but each editor has its own unique node ids, so two editors won't simply work. To support this case create another provider on the same path. The main reason we even have this wrapper is to support suspense.
}

export function SyncPath(props: {path: InputString, fallback: JSXElement, children: JSXElement}) {
  const prov = useSync()!

  //const [myversion, setMyVersion] = createSignal(0)

  // create a port and connect it using the tabstate.

  apiListen()

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

export function SyncProvider(props: { children: JSXElement }) {
  const u = new SyncProviderx()
  return <SyncContext.Provider value={u}>
        {props.children}
    </SyncContext.Provider>
}

class BufferProviderx {
   ds = new DocState()
   peer = new OmPeer() 
   
   constructor() {
     const 
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
  