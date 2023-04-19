
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
export class Ws {
    nextId = 1
    reply = new Map<number, [(data: any) => void, (data: any) => void]>()
    onmessage_ = new Map<string, NotifyHandler>()
    mock = new Map<string, MockHandler>
    ws?: WebSocket
    constructor(public url: string) {
    }
    connect() : Promise<any>{
        this.ws = new WebSocket(this.url)
        this.ws.onclose = (e) => {
            this.ws = undefined
        }
        this.ws.onmessage = async (e) => {
            // we need to parse the message.
            // split at '\n', first part is json, second part is binary
            console.log('got', e)
            const txt = await e.data.text()
            const data = JSON.parse(txt)
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
