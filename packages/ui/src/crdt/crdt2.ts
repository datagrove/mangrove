
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
    next = 0

    constructor(sharedWorker?: SharedWorker) {
        if (!sharedWorker) {
            const ls = new LocalState()
            const o = new MessageChannel()
            ls.connect(new WorkerChannel(o.port2))
            this.ls = localStateApi(new WorkerChannel(o.port1))
        } else {

        }
    }
    propose(op: Op[], version: number): Promise<boolean> {
        throw new Error("Method not implemented.")
    }
    updated(buffer: number, op: JsonPatch[], version: number[]): Promise<void> {
        throw new Error("Method not implemented.")
    }

    globalUpdate(op: Op[], version: number): Promise<void> {
        throw new Error("Method not implemented.")
    }
    transformed(key: string, buffer: number, op: JsonPatch[], sel: Selection): Promise<void> {
        throw new Error("Method not implemented.")
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
    async update(key: string, version: number, length: number): Promise<void> {
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

// tabstate should be the doc client.

interface Selection {
    start: number
    end: number
}

// we need a way for the document worker to send updates to the tabstate
// so the tabstate can alert the buffers.
// there's no great way a shared work to manage workers of its own. we could try using a leader, for now just duplicate the work

interface DocClientApi {
    propose(op: Op[], version: number): Promise<boolean>

    // update should be ignored if there have been intervening changes to editor (including selection); instead, call update again with the new changes. there is a select for each update though.
    // maybe we should patch the position map and let the editor do its own selection if it accepts the updates.
    updated(buffer: number, op: JsonPatch[],version: number[]): Promise<void>
}
interface DocApi {
    globalUpdate(op: Op[], version: number): Promise<void>
    // buffer is painful but neither lexical or prosemirror support sharing two views of the same document.
    // as such each can be on a sligly different version.
    update(buffer: number, op: JsonPatch[],sel: Selection): Promise<void> //Promise<[JsonPatch[],Selection]>
}
// we can use the listener api to send updates to tabstate from the Doc worker
// maybe should give the document a message port to the localstate?
// potentially give it a message port to each buffer?
class Doc implements DocApi {
    key: string = ""
    proposal: Op[] = []
    nextProposal: Op[] = []
    global?: DocState
    buffer = new Map<number,DocState>()

    // these can't fail or be invalid.
    async globalUpdate(op: Op[], version: number) {
        for (let o of op) {
            switch(o.type) {
                case "insert":
                    break;
                case "tag":
                    break;
                case "remove":
                    break;
            }
        }
    }

    // turn the patches into ops, and then mergeup
    // this gets call on either localstate changes or editor changes
    // these don't fail, but we need to be able invalidate tags and then patch the document to reflect that.
    async update(buffer: number, op: JsonPatch[], sel: Selection): Promise<void> {
        let doc = this.buffer.get(buffer)
        if (!doc) {
            doc = {
                version: 0,
                length: 0,
                tag: {},
                delete: {},
                text: "",
            }
            this.buffer.set(buffer, doc)
        }


        return
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




