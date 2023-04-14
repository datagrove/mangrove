import { Accessor, Component, For, JSX, Match, Switch, createResource, createSignal, onMount } from "solid-js";
import { BackNav, H2 } from "./nav";
import { A } from "@solidjs/router";
import { List } from "postcss/lib/list";

// lists are a common thing, can they be generalized?

export interface PageProps {
    title: string
    back?: string
    children?: JSX.Element
}

export function Page(props: PageProps) {
    return <><BackNav back={!!props.back} >
        { props.title}
    </BackNav>
        <div class='m-2'>
            {props.children}
        </div>
    </>
}



export interface Rpc<T> {
    method: string
    args: T
    id: number
}

export interface SocketLike {
    send(data: string): void
    onmessage(fn: (e: string)=>void) : void
}
export class Ws implements SocketLike {
    ws: WebSocket
    onmessage_?: (e: string)=>void
    constructor(public url: string) {
        this.ws = new WebSocket(url)
        this.ws.onmessage = (e) => {
            if (this.onmessage_)
                this.onmessage_(e.data)
        }
    }
    send(data: string) {
        this.ws.send(data)
    }
    onmessage(fn: (e: string)=>void) {
        this.onmessage_ = fn
    }
            
}

export class MockWs implements SocketLike {
    onmessage_?: (e: string)=>void
    constructor(public fn: (data: Rpc<any>)=>any){
    }
    send(data: string) {
        const rpc = JSON.parse(data) 
        const result = {
            value: this.fn(rpc)
        }
        if (this.onmessage_) {
            this.onmessage_(JSON.stringify({id: rpc.id, result}))
        }
    }
    onmessage(fn: (e: string)=>void) {
        this.onmessage_ = fn
    }
}

export class Cn {
    constructor(public s: SocketLike) {
        s.onmessage ((e: string) => {
            console.log('got', e)
            const data = JSON.parse(e)
            if (data.id) {
                const r = this.reply.get(data.id)
                if (r) {
                    this.reply.delete(data.id)
                    console.log("resolved",data.result)
                    r(data.result)
                    return
                }  else {
                    console.log("no awaiter", data.id)
                }
            } else {
                console.log("no id")
            }
        })
    }
    nextId = 1
    reply = new Map<number, (data: any) => void>()

    get<T>(method: string, args?: any) : () => Promise<OrError<T>> {
        const id = this.nextId++
        console.log('get', method, id, args)
        return ()=>new Promise<OrError<T>>((resolve, reject) => {
            this.reply.set(id, resolve)
            this.s.send(JSON.stringify({method, args, id: id}))
        })
    }
}

export interface OrError<T> {
    error?: string
    value?: T
}
    
export interface ListProps<T> {
    fetch: () => Promise<OrError<T[]>>
    children: (item: T,index: Accessor<number>) => JSX.Element
}
export function ListView<T>(props: ListProps<T>) {
    const [items] =  createResource(props.fetch)
    return <><Switch> 
            <Match when={items.loading}>
                Loading
            </Match>
            <Match when={true}>
            <table ><For each={items()?.value} >{
                props.children
            }</For></table></Match>
            </Switch></>
    
}

