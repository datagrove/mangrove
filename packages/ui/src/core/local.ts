
import { createContext, useContext } from "solid-js"
// @ts-ignore
import LocalStateWorker from "./localstate?sharedworker"
import { LocalStateClient, TabStateClient } from "./data"
import { Peer, WorkerChannel, apiSet } from "../abc/rpc"


// context for the tab to connect to localstate
export const LocalStateContext = createContext<LocalStateClient>()
export const useLocalState = () => useContext(LocalStateContext)


// this always produces the same LocalState
export function createLocalState(): LocalStateClient {
    const w = new LocalStateWorker()
    return connectLocalState(w.port)
}

export function connectLocalState(p: MessagePort) {
    const api: TabStateClient = {
        getDb: async function (): Promise<MessagePort> {
            throw new Error("Function not implemented.")
        },
        update: async function (handle: number): Promise<void> {
        }
    }
    let ch = new WorkerChannel(p)
    const peer = new Peer(ch, api)

    return apiSet<LocalStateClient>(ch, "publish", "subscribe")
}

