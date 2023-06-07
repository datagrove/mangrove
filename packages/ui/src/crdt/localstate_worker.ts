import { ConnectablePeer, Peer, WorkerChannel } from "./cloud";
import { LocalState } from "./localstate";

const ls = new LocalState()

let ctx: any = self as any

export function createSharedListener<T>(peer: ConnectablePeer) {
    ctx.onconnect = (e: any) => {

        // create a channel and connect it to the p
        const port = e.ports[0];

        port.addEventListener("message", (e: any) => {
            const rpc = e.data as {
                method: string
                id: number
                params: any
            }
            const ch = new WorkerChannel(port)
            peer.connect( )

            // const o = api[rpc.method] ?? unknown
            // o(context, rpc.params).then((r: any) => {
            //     port.postMessage({
            //         id: rpc.id,
            //         result: r
            //     })
            // }).catch((e: any) => {
            //     port.postMessage({
            //         id: rpc.id,
            //         error: e
            //     })
            // })
        })

        port.start(); // Required when using addEventListener. Otherwise called 

    }
}
createSharedListener(ls)