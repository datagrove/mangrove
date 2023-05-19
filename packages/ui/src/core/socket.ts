import { encode, decode } from 'cbor-x'
import { createSignal } from 'solid-js'
export interface Rpc<T> {
    method: string
    args: T
    id: number
    more: Uint8Array
}


// export interface SocketLike {
//     send(data: string): void
//     onmessage(fn: (e: string)=>void) : void
// }

export interface Watchable {
    handle: number
}

export interface ChangeRow<T> {
    op: 0 | 1 | 2
    value: Partial<T>  // must contain key
}
export interface UpdateRow<T> {
    handle: number
    updates: ChangeRow<T>[]
}

export type NotifyHandler = (r: Rpc<any>) => void
export type MockHandler = (args: any) => any

type rpcp = (e: Uint8Array) => void
export interface PortLike {
    postMessage: (data: any) => void
}

export class RpcService extends Map<string, MockHandler>{ }




// wrappers, any easy way? Zod?
// function commit(p: PortLike, tx: Tx) {
//     p.send('commit', tx)

// }


// allow (mock) filter for backend server
export class Ws {
    did_?: string
    didResolve?: (s: string) => void
    nextId = 1
    reply = new Map<number, [(data: any) => void, (data: any) => void]>()
    onmessage_ = new Map<string, NotifyHandler>()
    mock = new Map<string, MockHandler>
    ws?: WebSocket
    listen = new Map<number, (r: UpdateRow<any>[]) => void>()
    constructor(public url: string) {

    }
    async did(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.did_) {
                resolve(this.did_)
            } else {
                this.didResolve = resolve
            }

        })
    }

    connect(): Promise<any> {
        this.ws = new WebSocket(this.url)
        if (!this.ws) {
            throw new Error("no websocket")
        }
        this.ws.onclose = (e) => {
            this.ws = undefined
        }
        this.ws.onerror = (e) => {
            console.log("websocket error", e)
            this.ws = undefined
        }
        this.ws.onclose = (e) => {
            console.log("websocket close", e)
            this.ws = undefined
        }
        this.ws.onopen = () => {
            console.log("websocket open")
        }
        this.ws.onmessage = async (e: MessageEvent) => {
            // we need to parse the message.
            // split at '\n', first part is json, second part is binary
            console.log('got', e)

            let data: any
            if (typeof e.data === "string") {
                const txt = await e.data
                data = JSON.parse(txt)
            }
            else {
                const b = await e.data.arrayBuffer()
                data = decode(new Uint8Array(b))
            }

            if (data.id) {
                if (data.id < 0) {
                    const r = this.listen.get(data.id)
                    if (r) {
                        r(data.result)
                    } else {
                        console.log("no listener", data.id)
                    }
                } else {
                    const r = this.reply.get(data.id)
                    if (r) {
                        this.reply.delete(data.id)
                        if (data.result) {
                            console.log("resolved", data.result)
                            r[0](data.result)
                        } else {
                            console.log("error", data.error)
                            r[1](data.error)
                        }
                        return
                    } else {
                        console.log("no awaiter", data.id)
                    }
                }
            } else if (data.id === 0) {
                this.did_ = data.result
                if (this.didResolve) {
                    this.didResolve(this.did_!)
                }
            } else {
                console.log("no id")
            }
        }

        const r = new Promise((resolve, reject) => {
            this.ws!.onopen = () => {
                resolve(true)
            }
            this.ws!.onerror = () => {
                reject(false)
            }
        })
        return r
    }


    serve(method: string, fn: (arg: any) => any) {
        this.mock.set(method, fn)
    }


    async subscribe<R, A>(method: string, onupdate: (r: UpdateRow<A>[]) => void, params?: any) {
        const o = await this.rpc<Watchable>(method, params)
        this.listen.set(o.handle, onupdate)
        return o
    }
    release(handle: number) {
        this.listen.delete(handle)
    }
    async rpcje<T>(method: string, params?: any): Promise<[T | undefined, string]> {
        try {
            return [await this.rpcj(method, params), ""]
        } catch (e: any) {
            console.log("rpcje", e)
            return [undefined, e]
        }
    }
    async rpcj<T>(method: string, params?: any): Promise<T> {
        const o = this.mock.get(method)
        if (o) {
            return o(params) as T
        } else {
            console.log("send", method, params)
            const id = this.nextId++
            if (!this.ws) {
                await this.connect()
            }
            try {
                this.ws?.send(JSON.stringify({ method, params, id: id }))
            } catch (e) {
                this.ws?.close()
                await this.connect()
                this.ws?.send(JSON.stringify({ method, params, id: id }))
            }
            return new Promise<T>((resolve, reject) => {
                this.reply.set(id, [resolve, reject])
            })
        }
    }
    async rpce<T>(method: string, params?: any): Promise<[T | undefined, string]> {
        try {
            return [await this.rpc(method, params), ""]
        } catch (e: any) {
            return [undefined, e]
        }
    }
    // why not just return the promise?
    async rpc<T>(method: string, params?: any): Promise<T> {
        const o = this.mock.get(method)
        if (o) {
            return o(params) as T
        } else {
            console.log("send", method, params)
            const id = this.nextId++
            if (!this.ws) {
                await this.connect()
            }
            try {
                this.ws?.send(encode({ method, params, id: id }))
            } catch (e) {
                this.ws?.close()
                await this.connect()
                this.ws?.send(encode({ method, params, id: id }))
            }
            return new Promise<T>((resolve, reject) => {
                this.reply.set(id, [resolve, reject])
            })
        }
    }


}
export const [online, setOnline] = createSignal(false)
let ws_: Ws //= new Ws('ws://localhost:8088/wss')
export async function initWs(url: string) {
    return
    console.log("initWs", url)
    try {
        ws_ = new Ws(url)
        await ws_.connect()
        setOnline(true)
    } catch (e) {
        console.log("initWs", e)
        setOnline(false)
    }
}
export function createWs(url?: string): Ws {
    return ws_
}
export function addMock(method: string, fn: (arg: any) => any) {
    ws_.serve(method, fn)
}


/*
    static connect(u: string): Promise<Ws> {
        const ws = new WebSocket(u)

        return new Promise((resolve, reject) => {
            ws.onopen = () => {
                resolve(new Ws(u))
            }
        })
    }

export interface OrError<T> {
    error?: string
    value?: T
}

const wsCache = new Map<string, Ws>()

export class Profile {
    username = ""
    server = ""
}
export const profile = new Profile()
*/


