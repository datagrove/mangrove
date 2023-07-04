

// some how we need a way of diffing to get onto the current version
// like differential sync, but with rich text.
// the general idea is to go up as high as we need to to do the diff.

import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel } from "../abc/rpc"
import { useLexicalComposerContext } from "../lexical/lexical-solid"
import { create } from "sortablejs"

interface GlobalApi {
    propose (key: string, author: number, start: number, length: number, version: number) : Promise<[boolean, number]>
}
interface KeeperApi {

}

// a document can admit paths

// a document can accept 

class DocVersion {

}
class DocSt {
    constructor(public key: string){}
    global?: DocVersion
    local?: DocVersion
    channel = new Set<Channel>()
    version = 0
}
export interface DocApi {
    propose (grove: TreeUpdate[], version: number) : Promise<boolean>
    // I could just start another promise after accepting one?
    accept ( ) : Promise< TreeUpdate[]>
    close(): void
    setPath(path: string): void
}
class LocalState {
    doc = new Map<string, DocSt>()
    buffer = new Map<Channel, string>()
    global: GlobalApi

    globalUpdate(path: string, grove: TreeUpdate[]){

    }
 
    async getDoc(path: string): Promise<DocSt> {
        let st = this.doc.get(path)
        if (!st) {
            st = new DocSt(path)
            this.doc.set(path, st)
        }
        return st
    }

    localUpdate(doc: DocSt, grove: TreeUpdate[]) {
        // signal listeners
        for (let o in doc.channel) {
        
        }
        // create a proposal for the global state
        global.propose(doc.key,1, ).
    }

    // a buffer could allow the path to be changed? 
    connectDocument (ch: Channel) : DocApi {

        const r: DocApi = {
            propose: async ( grove: TreeUpdate[], version: number): Promise<boolean> => {
                const doc = this.getDoc(ch)
                if (doc.version !== version) {
                    return false
                }
                this.localUpdate(doc, grove)
                return false
            },

            accept: async (): Promise<TreeUpdate[]> => {
                const doc = this.getDoc(ch)
                return []
            },
            close:  (): void =>{
                const old = this.buffer.get(ch)
                if (old) {
                    this.doc.delete(old)
                }
                this.buffer.delete(ch)
            },
            setPath:  (path: string): void =>{
                const old = this.buffer.get(ch)
                if (old) {
                    this.doc.delete(old)
                }
                this.buffer.set(ch, path)
                this.getDoc(ch).channel.add(ch)
            }
        }
        return r
    }
}

interface TreeUpdate {
    op: "add" | "remove" | "replace" | "move" | "copy" | "test",
    path: string,
    value: any
}

type GroveUpdate = (tr: TreeUpdate[]) => void

// Maybe this should be the basis of a provider?
function createBuffer( upd: GroveUpdate) : DocApi{
    let api: DocApi
    const [version, setVersion] = createSignal(0)

    // can force lexical into an update so that we know we have all the changes?
    // should we wait for idle


    const propose = (grove: TreeUpdate[], version: number) => {

    }
    return undefined as any as DocApi
    // return something or other.
}

function LikeSync(props: { path: ()=>string}) {
    const [editor] = useLexicalComposerContext()
    const upd = (tr: TreeUpdate[]) => {
    }
    const buffer = createBuffer(upd)
    createEffect( () => {
        buffer.setPath(props.path())
    })

    editor.registerUpdateListener( () =>{
        let upd: TreeUpdate[] = []
        buffer.propose(upd,0)
    })
}


/*
class Buffer {


}

const BufferContext = createContext<Buffer>()
function useBuffer() {
    return useContext(BufferContext)
}

function WithBuffer(props: {children: any}) {
    const buffer = new Buffer()
    return <>
        <BufferContext.Provider value={buffer}>
            {props.children}
        </BufferContext.Provider>
     </>

}

function Test() {
    const [path,setPath] = createSignal("")

    return <WithBuffer path={path}>
        <TestEditor>
            <Sync></Sync> 
        </TestEditor>
    </WithBuffer>
    
    return 
}

function TestEditor() {
    const buffer = useBuffer()
    buffer.onchange( ()=> { })

}*/
