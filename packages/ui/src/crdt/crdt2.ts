
// a rope + interval tree that allows inserted formats.
// the invalidate, don't transform is most interesting with regard to deletions, but i think its ok. you bold, i delete, my delete is invalid because it didn't see your edits. I could also split into pieces though.

import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel, Service, WorkerChannel, apiSet } from "../abc/rpc"
import { JsonPatch } from "../lexical/sync"

// everything is grow only
interface Stat {
    version: number
    length: number
}
interface ListenerApi {
    update(key: string, version: number, length: number): void
}
function listenerApi(ch: Channel): ListenerApi {
    return apiSet(ch, "update")
}

interface GlobalApi {
    write(key: string, op: Op[], version: number): Promise<boolean>
    read(key: string, version: number): Promise<{ op: Op[], version: number }>
}
interface SubscriberApi {
    notify(key: string, op: Op[], version: number): Promise<boolean>
}
class Client {
    constructor(public api: SubscriberApi) {

    }
}
class EncryptedDoc { }
class GlobalState implements Service {
    client = new Map<Channel, Client>()
    doc = new Map<string, EncryptedDoc>()
    async connect(peer: Channel): Promise<GlobalApi> {
        return {
            write: async (key: string, op: Op[], version: number) => {
                return true
            },
            read: async (key: string, version: number) => {
                return { op: [], version: 0 }
            }
        }
    }
    async disconnect(ch: Channel) {

    }
}
type Err = string
interface LocalStateApi {
    open(key: string): Promise<undefined | Err>
    close(key: string): Promise<void>
    read(key: string, start: number): Promise<Op[]>
}
function localStateApi(ch: Channel): LocalStateApi {
    return apiSet(ch, "open", "close", "read")
}
class ListenerClient {
    listensTo = new Set<string>()
    constructor(public api: ListenerApi) {
    }
}

class DocLog {
    listener = new Set<ListenerApi>()
    version = 0
    op: Op[] = []
}
// an offline global state. 
class LocalState implements Service, ListenerApi {
    global?: GlobalApi

    // the thing getting updated here is the tracking database
    // we need to read the database to get the tracking information
    update(key: string, version: number): void {

    }
    client = new Map<Channel, ListenerClient>()
    doc = new Map<string, DocLog>()


    connect(ch: Channel): LocalStateApi {
        const cl = new ListenerClient(listenerApi(ch))
        this.client.set(ch, cl)
        const r: LocalStateApi = {
            read: async (key: string, start: number): Promise<Op[]> => {
                const doc = this.doc.get(key)
                if (!doc) {
                    return []
                }
                return doc.op.slice(start)
            },
            open: async (key: string): Promise<undefined | string> => {
                let doc = this.doc.get(key)
                if (!doc) {
                    doc = new DocLog()
                    // here we need to insert into the database that we share with global, so that we get updates.
                }
                doc.listener.add(cl.api)
                cl.listensTo.add(key)
                return
            },
            close: async (key: string): Promise<undefined> => {
                cl.listensTo.delete(key)
                this.doc.get(key)?.listener.delete(cl.api)
                return
            }
        }
        return r
    }

    disconnect(ch: Channel): void {
        const cl = this.client.get(ch)
        if (cl) {
        }
        this.client.delete(ch)
    }
}





interface Op {
    type: "insert" | "tag" | "remove"
    pos: number
    length: number
    text: string
}

type TagTree = {

}
type DeleteTree = {
}

type VersionSignal = (n: number) => void

class TabDoc {
   listen = new Set<VersionSignal>
   length = 0
   constructor(public api: DocApi){}
}
// tab state shares documents between buffers
class TabState implements ListenerApi {
    ls!: LocalStateApi
    doc = new Map<string,TabDoc >()

    constructor(sharedWorker?: SharedWorker) {
        if (!sharedWorker) {
            const ls = new LocalState()
            const o = new MessageChannel()
            ls.connect(new WorkerChannel(o.port2))
            this.ls = localStateApi(new WorkerChannel(o.port1))
        } else {

        }
    }
    getDoc(key: string): TabDoc {
        let doc = this.doc.get(key)
        if (!doc) {
            const api : DocApi = new Doc()
            doc = new TabDoc(api)
            this.doc.set(key, doc)
        }
        return doc
    }
    connect(key: string, fn: () => void) {
        let doc = this.getDoc(key)
        doc.listen.add(fn)

    }
    disconnect(key: string, fn: VersionSignal) {
        const d  = this.getDoc(key) 
        d .listen.delete(fn)
    }

    // called by localstate
    async update(key: string, version: number): Promise<void> {
        const d = this.getDoc(key)
        const op = await this.ls.read(key, d.length)
        await d.api.globalUpdate(op,version)
        this.getDoc(key).listen.forEach(fn => fn(version))
        return
    }
}
const TabContext = createContext<TabState>()
const useTab = () => useContext<TabState | undefined>(TabContext)

// there will be a buffer for each editor.
// it could have its own worker for integrating changes and making suggestions.
// each buffer maintains a doc, the local state has one. global state is just encrypted log and version
type DocState = {
    version: number
    length: number
    tag: TagTree
    delete: DeleteTree
    text: string
}

// Document is going to live in a worker; it will take ops from the server and json patches from the editor.
interface DocApi {
    globalUpdate(op: Op[], version: number): Promise<void>
    update(op: JsonPatch[],sel: Selection): Promise<[JsonPatch[],Selection]>
}
interface Selection {
    start: number
    end: number
}
class Doc implements DocApi {
    key: string = ""
    proposal: Op[] = []
    nextProposal: Op[] = []
    global?: DocState
    local : DocState = {
        version: 0,
        length: 0,
        tag: {},
        delete: {},
        text: ""
    }

    // these can't fail.
    async globalUpdate(op: Op[], version: number) {

    }

    // turn the patches into ops, and then mergeup
    // this gets call on either localstate changes or editor changes
    // these don't fail, but we need to be able invalidate tags and then patch the document to reflect that.
    async update(op: JsonPatch[], sel: Selection): Promise<[JsonPatch[],Selection]> {
        return [[],sel]
    }

}

// can buffer be completely in a worker an do the rest here?
export function createBuffer(key: (string | (() => string))) {
    const tab = useTab()!
    const [version, setVersion] = createSignal(0)

    let st = {
        key: "",
    }
    const setKey = (key: string)=> {
        if (st.key) {
            tab.disconnect(st.key, setVersion)
        }
        st.key = key
    }
    const b = new Doc()

    if (typeof key == "function") {
        const keyf = key as () => string
        createEffect(() => {
            setKey(keyf())
        })
        key = key()
    } else {
        setKey(key)
    }

    return [b.update.bind(b), version]
}




