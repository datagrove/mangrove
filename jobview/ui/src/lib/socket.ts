
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

type NotifyHandler = (r: Rpc<any>) => void
type MockHandler = (args: any) => any
// allow (mock) filter for backend server
class Ws {
    nextId = 1
    reply = new Map<number, [(data: any) => void, (data: any) => void]>()
    ws?: WebSocket
    onmessage_ = new Map<string, NotifyHandler>()
    mock = new Map<string, MockHandler>
    constructor(public url?: string) {
        this.url ??=  `wss://${window.location.host}/wss`
        this.connect()
    }

    connect() {
        try {
            this.ws = new WebSocket(this.url!)
            if (this.ws)
            this.ws.onmessage = async (e) => {
                // we need to parse the message.
                // split at '\n', first part is json, second part is binary
                console.log('got', e)
                const txt = await e.data.text()
                const data = JSON.parse( txt)
                if (data.id) {
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
                } else {
                    console.log("no id")
                }
            }
        } catch (e) {
            console.log("no websocket", e)
        }
        console.log("ws", this.url,this.ws?.readyState)
    }

    serve(method: string, fn: (arg: any) => any) {
        this.mock.set(method, fn)
    }

    // why not just return the promise?
    async rpc<T>(method: string, params?: any): Promise<T> {
        const o = this.mock.get(method)
        if (o) {
            return o(params) as T
        } else {
            console.log("send", method, params)
            const id = this.nextId++
            return new Promise<T>((resolve, reject) => {
                this.reply.set(id, [resolve, reject])
                this.ws?.send(JSON.stringify({ method, params, id: id }))
            })
        }
    }

}
export const ws = new Ws('ws://localhost:8088/wss')

export interface OrError<T> {
    error?: string
    value?: T
}
