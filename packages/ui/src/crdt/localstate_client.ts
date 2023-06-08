
import { createContext, useContext } from "solid-js"
// @ts-ignore
import LocalStateWorker from "./localstate?sharedworker"
import { LocalStateClient, TabStateClient, apiSet } from "./localstate_shared"
import { Peer, WorkerChannel } from "./rpc"


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
        becomeLeader: async function (): Promise<boolean> {
            throw new Error("Function not implemented.")
        },
        update: async function (handle: number): Promise<void> {
        }
    }
    let ch = new WorkerChannel(p)
    const peer = new Peer(ch, api)

    return apiSet<LocalStateClient>(ch, "publish", "subscribe")
}

