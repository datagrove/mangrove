import { Resource, Setter, createResource, onCleanup } from 'solid-js'
import { Ws } from './socket'

// when we pop up dialogs they can get a ws for whatever is the current database

export const ws :Ws = await Ws.connect('ws://localhost:8088/wss')

export class Snapshot<T> {
    constructor(public id: Uint8Array){

    }
}

export class Query<T> {
    sn: Snapshot<T>

    constructor( snapshotId: Uint8Array) {
        this.sn = new Snapshot<T>(snapshotId)
    }
}

interface UpdateEvent {

}

class TableCache {

}
export class PresentationCache<T> {
    snapshot = ""
    subscribed = false
    pr : Array<Presentation<T>> = []
    value: T[] = []
    constructor(public name: string){
    }
    update(ev: UpdateEvent) {
        // update value

        // update each presentation of the table
        this.pr.forEach(e => {
            e.value = this.value!
             e.mutate!(()=>e) 
         } )
    }
    add(l: Presentation<T>) {
        this.pr.push(l)
    }
    remove(l: Presentation<T>) {
        this.pr = this.pr.filter( e=> e!==l)
        if (this.pr.length==0) {
            profile.present.delete(this.name)
        }
    }
}

// it's not clear that this should have T?
// a presentation has a current query, it may share queries
// although this seems unlikely to be helpful

// Presentation is immutable, the wrapped cache may have mutation.

// this is what the resource needs to provide, like code mirror editor for document.
export class Presentation<T> {

    cacheKey: string = ""
    mutate?: Setter<Presentation<T>|undefined>
    value : T[] = []
    length = 0
    anchor = 0  // this is top of runway, it may not be visible
    top = 0

    operator() {
        return this.value
    }
}

// maybe like a store?
export class Updater<T> {

}

export class Db {
    
    view = new  Map<string,Query<any>>()
    constructor(public svr: Server,public  id: string) {

    }

}

export class Server extends WebSocket {
    db = new Map<string,Db>()

    addDb(id: string) {
    }
}

export class Profile {
    username = ""
    server = new Map<string,Server>()
    present = new Map<string, PresentationCache<any>>()

    addDb(url: string, id: string) {
        let svr = this.server.get(url)
        if (!svr) {
            svr = new Server(url)
        }
        svr.addDb(id)
    }

    async getWs(opt?: Popt) : Promise<Ws>{
        return ws;
    }

    getUrl(path: string, opt?: Popt){
        const svr = opt?.server??""
        const org = opt?.org??"/username"
        const db = opt?.db??"/"
        return `${svr}${org}${db}/${path}`
    }
}
export const profile = new Profile()

export function createWs() : Ws {
    return ws
}

// export function createPresentation<T>(view: string, opt: {db?: string,server?: string})  {
//     // this is going to create a resource, but it also responds to a signal
//     //
//     return createResource<T>(async ()=> ({} as T))
// }

export function createUpdater<T>(ud: Upd<T>) {
    return new Updater<T>
}
type Popt = {db?: string,server?: string,org?: string}


export function createPresentation<T>(pt: Pt<T>, opt?: Popt) {
    const url = profile.getUrl(pt.ptn, opt)
    let prc = profile.present.get(url)??new PresentationCache<T>(url)//
    if (!prc.subscribed) {
        profile.present.set(url, prc)
        prc.subscribed = true
    }
    const pr = new Presentation<T>()
    const fn = async ()=> {
        if (!prc!.value){
            const ws = await profile.getWs(opt)
            prc.snapshot = await ws.rpc<any>('watch', url)
        }
        return pr
    }
    
    const r =  createResource<Presentation<T>>(fn)
    const [_,{mutate}] = r
    pr.mutate = mutate

    prc.add(pr)
    onCleanup(async () => {
        prc.remove(pr)
        if (prc.pr.length==0) {
            profile.present.delete(url)
            const ws = await profile.getWs(opt)
            await ws.rpc<any>('release', url)
        }

    })

    // call mutate from the websocket notification after we update the presentation.
    return r
}

export type Pt<T> = {ptn: string}
export type Upd<T> = {ptu: string}


