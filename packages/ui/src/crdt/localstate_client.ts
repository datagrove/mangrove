
import { createContext, useContext } from "solid-js"
import { JsonPatch } from "../lexical/sync"
// @ts-ignore
import LocalStateWorker from "./localstate?sharedworker"
import { TabStateClient } from "./localstate_shared"
import { ApiSet, Channel, Peer, WorkerChannel } from "./rpc"





export interface LocalStateClient extends ApiSet {
    subscribe(path: string): Promise<{
        handle: number,
        doc: any
    }>
    publish(handle: number, patch: JsonPatch): Promise<JsonPatch>,

}
export interface LocalStateSignals {
    onchange: (handle: number) => void
    // tab must create a database worker and give it this port
    // of course this tab could die, so we need to have a timeout

    becomeLeader: (m: MessagePort) => boolean
    // tab must stop the database worker and release the files.
    revokeLeader: () => void
}

// class SharedWorkerChannel implements Channel {
//     constructor(public w: SharedWorker){

//     }
//     postMessage(data: any): void {
//         this.w.port
//     }
//     listen(fn: (d: any) => void): void {
//         throw new Error("Method not implemented.")
//     }
//     close(): void {
//     }

// }

export const LocalStateContext = createContext<LocalStateClient>()
export const useLocalState = () => useContext(LocalStateContext)

function apiSet<T>(peer: Peer, ...rpc: string[]): T {
    const o: any = {}
    rpc.forEach((e) => {
        o[e] = async (...arg: any[]): Promise<any> => {
            return await peer.rpc(e, arg)
        }
    })
    return o as T
}

// this always produces the same LocalState
export function createLocalState(): LocalStateClient {
    const w = new LocalStateWorker()
    return createLocalState2(w.port)
}
// this produces a new LocalState for each call, but it won't be in a shared worker
export function createLocalStateFake(): LocalStateClient {
    const mp = new MessageChannel()
    return createLocalState2(mp.port2)
}

export function createLocalState2(p: MessagePort) {
    const api: TabStateClient = {
        becomeLeader: function (): Promise<boolean> {
            throw new Error("Function not implemented.")
        },
    }
    let ch = new WorkerChannel(p)
    const peer = new Peer(ch, api)

    return apiSet<LocalStateClient>(peer, "publish", "subscribe")
}

