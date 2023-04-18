import { Resource, createResource } from 'solid-js'
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

export class PresentationCache {

}

// it's not clear that this should have T?
// a presentation has a current query, it may share queries
// although this seems unlikely to be helpful

// Presentation is immutable, the wrapped cache may have mutation.
export class Presentation<T> {
    loading = true
    error = ""
    latest?: T
    length = 0
    anchor = 0  // this is top of runway, it may not be visible
    top = 0


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
    server = new Map<string,Server>()
    present = new Map<string, Presentation<any>>()

    addDb(url: string, id: string) {
        let svr = this.server.get(url)
        if (!svr) {
            svr = new Server(url)
        }
        svr.addDb(id)
    }

    // should we give some context for creating dialogs? do we need to since window is a global state anyway?
    // a presentation url is server/org/database/viewset
    async getPresentation<T>(url: string) {
        const r = new Presentation<T>()

        return r;
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

export function createPresentation<T>(pt: Pt<T>, opt?: {db?: string,server?: string}) {

    const r =  createResource<T>(async ()=> ({} as T))
    const [_,{mutate}] = r
    // call mutate from the websocket notification after we update the presentation.

    mutate(()=>({}as T))

    return r
}

interface Log3 {
}
export type Pt<T> = {ptn: string}
export type Upd<T> = {ptu: string}
const log3 :Pt<Log3> = {ptn: "log"}

const x = createPresentation(log3)

