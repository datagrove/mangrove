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
export type Rpc = {
    method: string
    params: any
    id: number
}



export interface ConnectablePeer {
    connect(ch: Channel):void
    disconnect(ch: Channel):void
}


type Statusfn = (x: string)=>void
type Recv = (x: any) =>void
// maybe make a url that works with all of these?
class WorkerChannel implements Channel {
    constructor(public port: MessagePort,
        public status: Statusfn,
        public recv: Recv
        ) { 
            port.onmessage = recv
            status("")
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

class WsChannel implements Channel {
    constructor(public ws: WebSocket, public status: (x: string)=>void, public recv?: (d: any) => void) { 
        status("connecting")
        this.ws.onclose = () => this.status("closed")
        this.ws.onerror = () => this.status("error")
        this.ws.onopen = () => this.status("")
        this.ws.onmessage = async (e: MessageEvent)=> {
        if (typeof e.data === "string") {
            const txt = await e.data
            recv?.(JSON.parse(txt))
        } else {
            recv?.(decode(e.data))
        }
     }
    }
    listen(fn: (d: any) => void): void {
        this.recv = fn
    }
    postMessage(data: any): void {
        this.ws.send(data)
    }
    close() {
        this.ws.close()
    }
}

class WebRTC implements Channel {
    constructor(public pc: RTCDataChannel, public listen: (d:any)=>void, fn: (d:any)=>void) {

    }
    postMessage(data: any): void {
        this.pc.send(data)
    }
    close() {
        this.pc.close()
    }
}

export class Connector {
    local = new Map<string, (a: MessagePort) => void >()
  
    async open(url: string, status: (x: string)=>void, recv: (a: any)=>void ) : Promise<Channel> {
        const u = new URL(url)
        switch (u.protocol) {
            case "ws:":
            case "wss:":
                return new WsChannel(new WebSocket(url), status,recv)
            case "webrtc:":
                break;
            case "worker:":
                // this should be the url of a shared worker
                // we potentially have protocol for accessing dedicator works too.
                break;
            case "local:":
                const obj = this.local.get(url)
                if (!obj) throw  new Error("bad url " + url)
                const mc = new MessageChannel()
                obj(mc.port2)
                return new WorkerChannel(mc.port1, status, recv)

                break
        }

        throw new Error(`bad url ${url}`)
    }
}


export interface Peer {
    rpc: (message: Rpc) => Promise<RpcReply>
    notify: (message: Rpc) => void
    reply: (message: RpcReply) => void 
    // this can have any number of replies, some result c
    close(): void
} 

export class BaseClient {
    channel?: Channel
    status: ()=>string
    setOnline: (x: string)=>void
    constructor(public cn: Connector, public url: string ) {
        const [online,setOnline] = createSignal("connecting")
        this.status = online
        this.setOnline = setOnline
    }

    async connect()  {
        this.channel = await this.cn.open(this.url,
            this.setOnline,
            (a: any)=> {
                this.recv(a)
            })
    }

    // typeface interfaces, retry
    nextId = 1
    reply = new Map<number, [(data: any) => void, (data: any) => void]>()
    // onmessage_ = new Map<string, NotifyHandler>()
     async onrpc(method: string , id: number, params: any) : Promise<RpcReply> {
        console.log("unknown", method, params)
        return {
            id,
            error: "unknown"
        }
     }

    async recv(data: any) {
        if (data.method) {
            return this.onrpc(data.method, data.id, data.params)
        }
        // listening uses id < 0
        if (data.id) {
            const r = this.reply.get(data.id)
            if (!r) {
                this.channel?.postMessage({
                    id: data.id,
                    error: "unknown id " + data.id
                })
            }
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
                
                return {
                    
                }
            }
            //}
        } // if no method and no id, ignore.
    }

    async rpc<T>(method: string, params?: any): Promise<T> {
        console.log("send", method, params)
        const id = this.nextId++
        this.channel?.postMessage(structuredClone({ method, params, id: id }))
        return new Promise<T>((resolve, reject) => {
            this.reply.set(id, [resolve, reject])
        })
    }

}

