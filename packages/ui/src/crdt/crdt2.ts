
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
class TabState implements ListenerApi {
    ls!: LocalStateApi
    doc = new Map<string, Set<VersionSignal>>()

    constructor(sharedWorker?: SharedWorker) {
        if (!sharedWorker) {
            const ls = new LocalState()
            const o = new MessageChannel()
            ls.connect(new WorkerChannel(o.port2))
            this.ls = localStateApi(new WorkerChannel(o.port1))
        } else {

        }
    }

    connect(key: string, fn: () => void) {
        this.doc.get(key)?.add(fn)
    }
    disconnect(key: string, fn: VersionSignal) {
        this.doc.get(key)?.delete(fn)
    }
    update(key: string, version: number): void {
        this.doc.get(key)?.forEach(fn => fn(version))
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

// buffer is going to live in a worker; it will take ops from the server and json patches from the editor.
class Buffer {
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

    async globalUpdate(op: Op[]) {

    }

    // turn the patches into ops, and then mergeup
    // this gets call on either localstate changes or editor changes
    async update(op: JsonPatch[]): Promise<JsonPatch[]> {
        if (op.length == 0) {
            // integrate server changes
            let ops = await this.tab.ls.read(this.key, this.local.length)
        } else {
            // integrate local changes
            // optionally use worker?
        }
        return []
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
    const b = new Buffer()

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



async function buffer_mergeup(doc: Doc, op: Op[], version: number): Promise<boolean> {
    if (version != doc.local.version + 1) {
        return false
    }
    if (doc.proposal.length > 0) {
        doc.nextProposal.push(...op)
    } else {
        doc.proposal = op
        doc.mergeup(doc.proposal, doc.global.version + 1)
    }
    return true
}
function mergedown(doc: Doc, op: Op[]): Doc {
    return doc
}

