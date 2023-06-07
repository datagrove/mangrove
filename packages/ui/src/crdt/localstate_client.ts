
import { createContext, useContext } from "solid-js"
import { JsonPatch } from "../lexical/sync"
// @ts-ignore
import LocalStateWorker from "./localstate?sharedworker"
import { TabStateClient } from "./localstate_shared"
import { Channel } from "./cloud"


export interface LocalStateClient {
    subscribe(path: string) : Promise<{
        handle: number,
        doc: any
    }>
    publish(handle: number, patch: JsonPatch) : JsonPatch,
 
}
export interface LocalStateSignals {
    onchange: (handle: number)=>void
    // tab must create a database worker and give it this port
    // of course this tab could die, so we need to have a timeout

    becomeLeader: (m: MessagePort) => boolean
    // tab must stop the database worker and release the files.
    revokeLeader: ()=>void
}


export const LocalStateContext = createContext<LocalStateClient>()
export const useLocalState = () => useContext(LocalStateContext)


export function createLocalState(sig: LocalStateSignals) : LocalStateClient {
    const w = new LocalStateWorker()
    let c: Channel
    
    const api : TabStateClient = {
        becomeLeader: function (): Promise<boolean> {
            throw new Error("Function not implemented.")
        },

    }
    let c: channelFromWorker(w) 
    c.listen((m) => {
        
    })
    
    return {
        async subscribe(path: string,onchange: ()=>void) {
            return {
                handle: 0,
                doc: {}
            }
        },
        publish(handle: number, patch: JsonPatch) : JsonPatch {
            return patch
        },

    }
}

