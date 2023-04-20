import { encode, decode } from 'cbor-x'
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

type NotifyHandler = (r: Rpc<any>) => void
type MockHandler = (args: any) => any
// allow (mock) filter for backend server
export class Ws {
    nextId = 1
    reply = new Map<number, [(data: any) => void, (data: any) => void]>()
    onmessage_ = new Map<string, NotifyHandler>()
    mock = new Map<string, MockHandler>
    ws?: WebSocket
    constructor(public url: string) {
    }
    connect(): Promise<any> {
        this.ws = new WebSocket(this.url)
        this.ws.onclose = (e) => {
            this.ws = undefined
        }
        this.ws.onmessage = async (e: MessageEvent) => {
            // we need to parse the message.
            // split at '\n', first part is json, second part is binary
            console.log('got', e)
            const b = await e.data.arrayBuffer()

            //const data = JSON.parse(txt)
            const data = decode(new Uint8Array(b))
            console.log("decode",data)
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

    listen = new Map<number, (r: UpdateRow<any>[]) => void>()
    async subscribe<R, A>(method: string, onupdate: (r: UpdateRow<A>[]) => void, params?: any) {
        const o = await this.rpc<Watchable>(method, params)
        this.listen.set(o.handle, onupdate)
        return o
    }
    release(handle: number) {
        this.listen.delete(handle)
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

    static async connect(u: string): Promise<Ws> {
        const ws = new WebSocket(u)

        return new Promise((resolve, reject) => {
            ws.onopen = () => {
                resolve(new Ws(u))
            }
        })
    }
}

//this.url ??=  `wss://${window.location.host}/wss`


export interface OrError<T> {
    error?: string
    value?: T
}
export const ws: Ws = await Ws.connect('ws://localhost:8088/wss')
const wsCache = new Map<string, Ws>()
export function getWs(url?: string): Ws {
    if (url) {
        const x = new URL(url)
        const key = `${x.host}:${x.port}`
        let r = wsCache.get(key)
        if (!r) {
            r = new Ws(key)
            wsCache.set(key, r)
            return r
        }
        return r
    }
    else return ws
}
export class Profile {
    username = ""
    server = ""
}
export const profile = new Profile()

export function createWs(): Ws {
    return ws
}