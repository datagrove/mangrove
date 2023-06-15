import { decode } from "cbor-x"
import { createContext, createSignal, useContext } from "solid-js"


export interface Channel {
    postMessage(data: any): void
    listen(fn: (d: any) => void): void
    close(): void
}

export type RpcReply = {
    id: number
    result?: any
    error?: any
}
export type Rpc<T> = {
    method: string
    params: T
    id: number
}

export interface Service {
    connect(ch: Channel): object // return api set. not sure how to type this yet.
    disconnect(ch: Channel): void
}


export class Listener {
    _listen = new Set<() => void>()
    add(p: () => void) {
        this._listen.add(p)
    }
    remove(p: () => void) {
        this._listen.delete(p)
    }
    notify() {
        for (let p of this._listen) {
            p()
        }
    }
}

type Statusfn = (x: string) => void
type Recv = (x: any) => void
// maybe make a url that works with all of these?
export class WorkerChannel implements Channel {
    constructor(public port: MessagePort) {
        if (!(port instanceof MessagePort)) {
            throw new Error("not a message port")
        }
    }
    postMessage(data: any): void {
        this.port.postMessage(data)
    }
    listen(fn: (d: any) => void): void {
        this.port.onmessage = fn
    }
    close() {
        this.port.close()
    }
}



export class WsChannel implements Channel {
    ws?: WebSocket
    constructor(public url: string, public status: (x: string) => void, public recv?: (d: any) => void) {
        this.connect()
    }
    connect() {
        this.ws = new WebSocket(this.url)
        this.status("connecting")
        this.ws.onclose = () => {
            this.status("closed")
            setTimeout(() => this.connect(), 1000)
        }
        this.ws.onerror = () => {
            this.status("error")
            setTimeout(() => this.connect(), 1000)
        }
        this.ws.onopen = () => this.status("")
        this.ws.onmessage = async (e: MessageEvent) => {
            if (typeof e.data === "string") {
                const txt = await e.data
                this.recv?.(JSON.parse(txt))
            } else {
                this.recv?.(decode(e.data))
            }
        }
    }
    listen(fn: (d: any) => void): void {
        this.recv = fn
    }
    postMessage(data: any): void {
        this.ws?.send(data)
    }
    close() {
        this.ws?.close()
    }
    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN
    }
}

export class WebRTC implements Channel {
    constructor(public pc: RTCDataChannel, public listen: (d: any) => void, fn: (d: any) => void) {

    }
    postMessage(data: any): void {
        this.pc.send(data)
    }
    close() {
        this.pc.close()
    }
}

// imported into every worker? how do we register in every worker?
// we might need 



// export interface Peer {
//     rpc: (message: Rpc<any>) => Promise<RpcReply>
//     notify: (message: Rpc<any>) => void
//     reply: (message: RpcReply) => void 
//     // this can have any number of replies, some result c
//     close(): void
// } 

export type ApiSet = {
    [key: string]: ((...a: any[]) => Promise<any>)
}

// a peer needs to support multiple api's, for listening try each in order.
export class Peer {
    nextId = 1
    reply_ = new Map<number, [(data: any) => void, (data: any) => void]>()
    api: ApiSet[] = []

    constructor(public ch: Channel) {
        ch.listen((d: any) => {
            this.recv(d.data)
        })
    }

    async rpc<T>(method: string, params?: any, transfer?: any[]): Promise<T> {
        const w = this.ch as WorkerChannel
        console.log("send", method, params, transfer)
        const id = this.nextId++
        if (transfer) {
            console.log("transfer", transfer)
            w.port.postMessage({ method, params, id: id }, transfer)
        } else {
            this.ch?.postMessage({ method, params, id: id })
        }
        return new Promise<T>((resolve, reject) => {
            this.reply_.set(id, [resolve, reject])
        })
    }

    async recv(data: any) {
        console.log("recv", data)
        if (data.method) {
            for (let apix of this.api) {
                const api = apix[data.method]
                if (!api) {
                    continue
                }
                try {
                    const result = await api.apply(null,data.params)
                    this.ch?.postMessage({
                        id: data.id,
                        result: result
                    })
                    return
                } catch (e: any) {
                    this.ch?.postMessage({
                        id: data.id,
                        error: e.toString()
                    })
                    return
                }
            }
        }
        else if (data.id) {
            const r = this.reply_.get(data.id)
            if (!r) {
                this.ch?.postMessage({
                    id: data.id,
                    error: "unknown id " + data.id
                })
            } else {
                this.reply_.delete(data.id)
                if (data.result) {
                    console.log("resolved", data.result)
                    r[0](data.result)
                } else {
                    console.log("error", data.error)
                    r[1](data.error)
                }
                return
            }
            //}
        } else {
            console.log("unknown message", data)
        }
    }
}
// we create api's from channels
// build an rpc set from a list of rpc names
// eventually change this to code generation, or maybe typescript magic
export function apiCall<T>(peer: Peer, ...rpc: string[]): T {

    const o: any = {}
    rpc.forEach((e) => {
        o[e] = async (...arg: any[]): Promise<any> => {
            return await peer.rpc(e, arg)
        }
    })
    return o as T
}

// listen on a peer? maybe we should wrap call on a peer too.
export function apiListen<T>(peer: Peer, api: T): void {
    peer.api.push(api as ApiSet)
}
/*
export class BaseClient {
    peer?: Peer
    status: () => string
    setOnline: (x: string) => void
    constructor(public cn: Cloud, public url: string) {
        const [online, setOnline] = createSignal("connecting")
        this.status = online
        this.setOnline = setOnline
    }

    async connect(channel: Channel) {
        this.channel = await this.cn.open(this.url,
            this.setOnline,
            (a: any) => {
                this.recv(a)
            })
    }

    // typeface interfaces, retry

    // onmessage_ = new Map<string, NotifyHandler>()



    async rpc<T>(method: string, params?: any): Promise<T> {
        console.log("send", method, params)
        const id = this.nextId++
        this.channel?.postMessage(structuredClone({ method, params, id: id }))
        return new Promise<T>((resolve, reject) => {
            this.reply.set(id, [resolve, reject])
        })
    }

}*/

