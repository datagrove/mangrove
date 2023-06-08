import { ApiSet, ConnectablePeer, Peer, Rpc, WorkerChannel, WsChannel } from "./rpc";
import { LocalState } from "./localstate";


let ctx: any = self as any

export function createSharedListener<T>(peer: ConnectablePeer) {
    ctx.onconnect = async (e: any) => {

        // create a channel and connect it to the p
        const port = e.ports[0];
        const ch = new WorkerChannel(port)
        const a: ApiSet = peer.connect(ch)

        port.addEventListener("message", async (e: MessageEvent) => {
            const x: Rpc<any> = e.data
            const fn = a[x.method]
            if (!fn) {
                port.postMessage({
                    id: x.id,
                    error: "unknown " + x.method
                })
            } else {
                try {
                    const a = await fn(x.params)
                    port.postMessage({
                        id: x.id,
                        result: a
                    })                    
                }catch(e: any){
                    port.postMessage({
                        id: x.id,
                        error: e.toString()
                    })
                }
            }   
        })

        port.start(); // Required when using addEventListener. Otherwise called 

    }
}
const status = (x: string)=> {
    console.log("status",x)
}
const ls = new LocalState({
    cloud: (url: string) => new WsChannel(url,status)
})
createSharedListener(ls)