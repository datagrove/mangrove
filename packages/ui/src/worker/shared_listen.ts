

// framework for service apis
// 

import { ListenerContext, ServiceFn } from "./data";
export type { ListenerContext, ServiceFn } from "./data";
// this should be part of a call back client. both shared and worker

// this needs to go to the main thread, even if the error is from a worker


//const st = new Store("db")
const ctx = self as any;
// service abstracted so it could run in the main thread, it's just a map of callbacks.

export function createSharedListener<T>(api: ServiceFn<T>, init: T) {
    ctx.onconnect = (e: any) => {
        const port = e.ports[0];
        const state = { ...init }
        const context = new ListenerContext((x: any) => port.postMessage(x), state)

        // if the api does not have a log function, add one
        if (!api["log"]) {
            api["log"] = async (context: ListenerContext<any>, params: any) => {
                port.postMessage({
                    method: "log",
                    params: params
                })
            }
        }
        let unknown = api["unknown"]
        if (!unknown) {
            unknown = async (context: ListenerContext<any>, params: any) => {
                context.log("unknown", params)
            }
        }
        port.addEventListener("message", (e: any) => {
            const rpc = e.data as {
                method: string
                id: number
                params: any
            }
            const o = api[rpc.method] ?? unknown
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
        })

        port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
        let initfn = api["connect"]
        if (initfn) {
            initfn(context, {})
        }
        context.log("connected wtf", initfn)

        //addPort(port)
    }
}