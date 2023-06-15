import { ApiSet, Service, Rpc, WorkerChannel } from "./rpc";
let ctx = self as any
export function createSharedListener<T>(peer: Service) {
    ctx.onconnect = async (e: any) => {

        // create a channel and connect it to the p
        const port = e.ports[0];
        const ch = new WorkerChannel(port)
        const a:any = peer.connect(ch)

        console.log("waiting for message")
        port.addEventListener("message", async (e: MessageEvent) => {
            console.log("worker got", e.data)
            const x: Rpc<any> = e.data
            const fn = a[x.method]
            if (!fn) {
                console.log("unknown method", x.method)
                port.postMessage({
                    id: x.id,
                    error: "unknown " + x.method
                })
            } else {
                try {
                    const a = await fn.apply(null,x.params)
                    console.log("worker reply", x.id, a)
                    port.postMessage({
                        id: x.id,
                        result: a
                    })                    
                }catch(e: any){
                    console.log("error", e)
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