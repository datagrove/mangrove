

// some how we need a way of diffing to get onto the current version
// like differential sync, but with rich text.
// the general idea is to go up as high as we need to to do the diff.

import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel } from "../abc/rpc"


// a document can admit paths

// a document can accept 

class DocVersion {

}
class DocSt {
    global?: DocVersion
    local?: DocVersion
    channel = new Set<Channel>()
    version = 0
}
export interface DocApi {
    propose (grove: TreeUpdate[], version: number) : Promise<boolean>
    // I could just start another promise after accepting one?
    accept ( version: number) : Promise< TreeUpdate[]>
    close(): void
    setPath(path: string): void
}
class LocalState {
    doc = new Map<string, DocSt>()
    buffer = new Map<Channel, string>()

    globalUpdate(path: string, grove: TreeUpdate[]){

    }
 
    getDoc(ch: Channel): DocSt {
        let st = this.doc.get(path)
        if (!st) {
            st = new DocSt()
            this.doc.set(path, st)
        }
        return st
    }

    localUpdate(doc: DocSt, grove: TreeUpdate[]) {

        // signal all the channels that the document has changed by resolving their promise.
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

            accept: async (version: number): Promise<TreeUpdate[]> => {
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


// Maybe this should be the basis of a provider?
function docBuffer( api: DocApi) {

    const [version, setVersion] = createSignal(0)

    createEffect(() => {
        const s= version()
        // should try to accept the changes here.
        api.accept(s)
    })
    
    // can force lexical into an update so that we know we have all the changes?
    // should we wait for idle


    const propose = (grove: TreeUpdate[], version: number) => {

    }
   
    // return something or other.
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
