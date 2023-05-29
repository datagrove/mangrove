import { ListenerContext, ServiceFn } from "./data";

export function createListener<T>(api: ServiceFn<T>, init: T) {
    const ctx = self as any;
    const state = { ...init }
    const context = new ListenerContext((x: any) => ctx.postMessage(x), state)

    ctx.onmessage = (e: any) => {
        const rpc = e.data as {
            method: string
            id: number
            params: any
        }
        const o = api[rpc.method]
        if (o) {
            o(context, rpc.params).then((r: any) => {
                ctx.postMessage({
                    id: rpc.id,
                    result: r
                })
            }).catch((e: any) => {
                ctx.postMessage({
                    id: rpc.id,
                    error: e
                })
            })
        } else {
            ctx.postMessage({ id: rpc.id, error: `no method ${rpc.method}` })
        }
    }
    let initfn = api["connect"]
    if (initfn) {
        initfn(context, {})
    }

}
