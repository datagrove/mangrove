import { createSignal } from "solid-js";

export interface Op {
	ty: string;
	ix: number;
	pri?: number;
	ch?: string;
	id: number;
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



export interface Peer {
    rpc: (message: Rpc) => Promise<RpcReply>
    notify: (message: Rpc) => void
    reply: (message: RpcReply) => void 
    // this can have any number of replies, some result c
    close(): void
} 


export interface ConnectablePeer {
    connect(peer: Peer): Peer
    disconnect(peer: Peer): void
}


export interface Cloud {
    connect(url: string,status: (online: boolean)=>void ): Promise<Peer>
    disconnect(peer: Peer): void
}


interface Channel {
    postMessage(data: any): void
    listen(fn: (d: any)=>void): void
}

// maybe make a url that works with all of these?
class WorkerChannel implements Channel {
    constructor(public port: MessagePort) { }
    postMessage(data: any): void {
        this.port.postMessage(data)
    }
    listen(fn: (d: any) => void): void {
        this.port.onmessage = fn
    }
}

class WebsocketPeer implements Channel {

    constructor(public ws: WebSocket) { 
        
    }
    postMessage(data: any): void {
        this.ws.send(data)
    }
    listen(fn: (d: any) => void): void {
         this.ws.onmessage = fn
    }

}

class WebRTC implements Channel {
    constructor(public pc: RTCDataChannel) {

    }
    postMessage(data: any): void {
        this.pc.send(data)
    }
    listen(fn: (d: any) => void): void {
        this.pc.onmessage = fn
    }
}


export async function connect(url: string, status: (x: boolean)=>void ) : Promise<Peer> {
    const u = new URL(url)
    switch (u.protocol) {
        case "ws:":
        case "wss:":
            return new WebsocketPeer(ws)
            break;
        case "webrtc:":
            break;
        case "worker:":
            break;
        case "local:":
            break
    }

    throw new Error(`bad url ${url}`)
}


export class BaseClient {
    peer?: Peer
    status: ()=>boolean
    setOnline: (x: boolean)=>void
    constructor( ) {
        const [online,setOnline] = createSignal(false)
        this.status = online
        this.setOnline = setOnline
    }

    async connect(url: string)  {
        this.peer = await connect(url,this.setOnline)
    }

    // typeface interfaces, retry
    

}