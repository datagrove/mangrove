
// write to databases with version locks on arbitrary keys.
// can the keys not be persistent? lock(key, siteVersion, keyVersion)
// if the keyVersion has not changed after the siteVersion, then the write is allowed.
// siteVersion = max(keyVersion)
// keyVersion is the last siteVersion that wrote to the key.
// as long as nobody has written to the key since then, the write is allowed.
import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel, Service, WorkerChannel, apiSet } from "../abc/rpc"
import { JsonPatch } from "../lexical/sync"
import { GlobalApi, ListenerApi } from "./data"

interface KeeperApi {
    read(key: string, version: number): Promise<Uint8Array>
}


class EncryptedDoc { 
    version = 0
    length = 0
}
class User {

}
class Client {
    // listens to should be restored from a database
    // when we write to this database, it is shared back to the localstate, the localstate then syncs according to it.
    
    listensTo = new Set<string>()
    constructor(public api: ListenerApi) {

    }
}

class GlobalState implements Service {
    client = new Map<Channel, Client>()
    doc = new Map<string, EncryptedDoc>()
    async connect(peer: Channel): Promise<GlobalApi> {
        const r: GlobalApi = {
            commit: function (site: number, lock: number[], data: Uint8Array): Promise<boolean> {
                throw new Error("Function not implemented.")
            }
        }
        return r
    }
    async trigger(key: string)  {
        const doc = this.doc.get(key)
        if (!doc) {
            return
        }
        for (const c of this.client.values()) {
            c.api.update(key, doc.version, doc.length)
        }
    }
    async disconnect(ch: Channel) {
        // close the user database here if this is the last channel
    }
}
let gs = new Map<string, GlobalState>()
function createGlobalState(url: string) {
    const u =  gs.get(url)
    if (u) {
        return u
    }
    const g = new GlobalState()
    gs.set(url, g)
    return g
}
