

// framework for service apis
// 
export class ListenerContext<T> {
    public constructor(public port: MessagePort, public state: T) {
    }
    log(...args: any[]) {
        this.port.postMessage({
            method: 'log',
            id: 0,
            params: args,
        });
    }
}
// this should be part of a call back client. both shared and worker

// this needs to go to the main thread, even if the error is from a worker


//const st = new Store("db")
const ctx = self as any;
// service abstracted so it could run in the main thread, it's just a map of callbacks.
export type ServiceFn<State> = {
    [key: string]: (context: ListenerContext<State>, params: any) => Promise<any>
}

export function createSharedListener<T>(api: ServiceFn<T>, init: T, initfn?: (ctx: ListenerContext<T>) => void) {
    ctx.onconnect = (e: any) => {
        const port = e.ports[0];
        const state = { ...init }
        const context = new ListenerContext(port, state)


        port.addEventListener("message", (e: any) => {
            const rpc = e.data as {
                method: string
                id: number
                params: any
            }
            const o = api[rpc.method]
            if (o) {
                o(context, rpc.params).then((r: any) => {
                    port.postMessage({
                        id: rpc.id,
                        result: r
                    })
                }).catch((e: any) => {
                    port.postMessage({
                        id: rpc.id,
                        error: e
                    })
                })
            } else {
                port.postMessage({ id: rpc.id, error: `no method ${rpc.method}` })
            }
        })

        port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
        if (initfn) {
            initfn(context)
        }
        //addPort(port)
    }
}