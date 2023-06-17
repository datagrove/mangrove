
import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel, Service, WorkerChannel, apiCall } from "../abc/rpc"
import { JsonPatch } from "../lexical/sync"
import { GlobalApi, ListenerApi, LocalStateApi, Op, listenerApi } from "./data"


// everything is grow only
interface Stat {
    version: number
    length: number
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

class GlobalClient {
    constructor(public api: GlobalApi) {
    }
}
// an offline global state. 
export class LocalState implements Service, ListenerApi {
    global = new Map<string, GlobalClient>()

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




