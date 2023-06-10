import { ApiSet, Service, Rpc, WorkerChannel } from "./rpc";
let ctx = self as any
export function createSharedListener<T>(peer: Service) {
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