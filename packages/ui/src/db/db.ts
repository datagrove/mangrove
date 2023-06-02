
// user settings should be a store? does the context deliver a store then?
// is a database something related but different than a store?

// some of these things we might replace with C++



// there is only one database, so that's global constant
// it acts like a store (is it a store?), views are reactive
// views should be an array of cells, so that edits are 2 way

import { Accessor, createSignal } from "solid-js"
import { CellOptions } from "./v2/cell"


import { Api, SendToWorker, createSharedWorker, createWorker } from '../worker/useworker'
import { ListenerContext } from "../worker/data"


export interface SiteRef {
    name: string
    did: string
}


export type FacetSelect<T> = {
    limit?: number
    offset?: number
}
export class Db {
    public constructor(public w: SendToWorker) {
    }


    recentGroup(n: number) {
        const group :SiteRef = {
            name: "private",
            did: ""
          }
          return [group]
    }
    async uploadFiles(files: FileList, path: string) {
        // this has to go to the dedicated worker
        await this.w.rpc('dropFiles', { dropFiles: [...files] })
        // the drop files should signal client already?
    }
}

// we create a dedicated worker when we become leader
// we stay leader until this tab is closed.
let dbw: SendToWorker | undefined

export const callbackApi: Api = {
    becomeLeader: async (context: ListenerContext<any>, params: any) => {
        console.log("becomeLeader starting worker")
        // when we get messages back from the database worker we need to return them to the shared worker
        const swapi = {
            log: async (context: ListenerContext<any>, params: any) => {
                console.log(...params)
            },
            unknown: async (context: ListenerContext<any>, msg: any) => {
                sharedWorker?.send(msg)
            }
        }
        //dbw = await createWorker(new Worker, swapi)
    },
    log: async (context: ListenerContext<any>, params: any) => {
        console.log(...params)
    },
    unknown: async (context: ListenerContext<any>, params: any) => {
        if (dbw) {
            return dbw.send(params)
        } else {
            console.log("unknown message", params)
        }
    }
}
// messages that come back from db worker need to be sent to shared worker


// always global, because shared worker is global
let sharedWorker : SendToWorker | undefined

let db: Db // new Db(sharedWorker)



// makeCell(cellTemplate)
// we could have a query return cellTempate[]? more like it takes that as argument

// queries return lenses? select lens(name) 
export interface Query {
    sql: string
    cells?: CellOptions[]
}

// how do we support suspense?
// can we support schema changes such as adding a column?

// the estimated size of the query is reactive and it can stream diffs as the data is updated.
// use something like a for component memoize ?
export interface QueryResult {
    error: string
    loaded: boolean
    query: Query
    estimatedSize: Accessor<number>
}

// seems like overkill, using scroller anyway, scroller can manage
// type ForFn = (result: QueryResult) => JSX.Element
// export function QueryFor(props: { each: QueryResult, children: ForFn}): JSX.Element {
//     return <div>QueryFor</div>
// }

// derive queries
// close: () => { },
// filter: (pattern: string) => { },
// rows: (start: number, end: number) => { return [] },

export function closeQuery(query: QueryResult) {

}

export function createQuery(desc: Query, ...params: any[]): QueryResult {
    const [size, setSize] = createSignal(0)
    return {
        error: "",
        loaded: true,
        query: desc,
        estimatedSize: size
    }

}
