
// user settings should be a store? does the context deliver a store then?
// is a database something related but different than a store?
// there is only one database, so that's global constant
// it acts like a store (is it a store?), views are reactive
// views should be an array of cells, so that edits are 2 way

import { Accessor, createSignal } from "solid-js"
import { CellOptions } from "./v2/cell"
import { Api, SendToWorker, createSharedWorker, createWorker } from '../worker/useworker'
import { ListenerContext } from "../worker/data"
import { ScanQueryCache, ScanQuery, RangeSource } from "./data"
// @ts-ignore
import Shared from './shared?sharedworker'
// @ts-ignore
import Worker from './worker?worker'
import { QuerySchema, Transaction, Query } from "./schema"
import { update } from "../lib/db"
import { Changefn, HtmlDiff } from "../crdt/dgot"

const dbmap = new Map<string, Db>()


export function createQuery<Key, Tuple>(
    db: Db,
    t: QuerySchema<Key>,
    q: Partial<ScanQuery<Key, Tuple>>,
    listener: (s: ScanDiff) => void): RangeSource<Key, Tuple> {

    // assign q a random number? then we can broadcast the changes to that number?
    // we need a way to diff the changes that works through a message channel.
    // hash the key -> version number, reference count?
    // the ranges would delete the key when no versions are left.
    // we send more data than we need to this way?
    q.handle = db.next++
    db.w.send({
        method: 'scan',
        params: q
    })
    const rs = new RangeSource<Key, Tuple>(db, q as ScanQuery<Key, Tuple>, t, listener)
    db.range.set(q.handle, rs)
    return rs
}

export function createDb(name: string) {
    // Wrong! this needs more complexity to share across tabs.
    let db = dbmap.get(name)
    if (!db) {
        db = new Db()
        dbmap.set(name, db)
        db.w.send({
            method: 'init',
            params: name
        })
    }
    return db
}

export interface SiteRef {
    name: string
    did: string
}

export type FacetSelect<T> = {
    limit?: number
    offset?: number
}
// this is for the main thread, it mostly communicates with the database thread
// can the listener be in the contstructor? 
// in theory this should not be global, because we can start a worker for each?


export class DbTransaction extends Transaction {
    constructor(public db: Db,public server: string, public site: string) {
        super()
    }
    commit() {
        this.db.w.send({
            method: 'commit',
            params: {
                server: this.server,
                site: this.site,
                updates: this.tx
            }
        })

    }
}
export async function exec<A,T>(db: Db, q: Query<A,T>, params: A): Promise<T[]> {
    return db.w.rpc('query', {
        sql: q.sql,
        params: params
    }
    )
}

export class Db {
    // each db corresponds to a worker
    w: SendToWorker
    next = 0
    range = new Map<number, RangeSource<any, any>>()
    public constructor() {
        this.w = createWorker(new Worker, callbackApi(this))
    }
    recentGroup(n: number) {
        const group: SiteRef = {
            name: "private",
            did: ""
        }
        return [group]
    }
    // we will get the server and the site from the url
    // might use other options as well? like readonly?
    // maybe server and site should be optional and default the home server and user database? awkward that all the tuples need to work around this
    // maybe this needs to be $server and $site, so we can substitute.
    begin(server: string, site: string) {
        return new DbTransaction(this,server,site)
    }
    query(sql: string , params?: any) {
        return this.w.rpc('query', {
            sql: sql,
            params: params
        })
    }
    // not right? maybe pass it a query function?
    // 
    htmlLens(table: string, id: number) {
        const r : HtmlLens = {
            update: function (x: HtmlDiff): HtmlDiff {
                throw new Error("Function not implemented.")
            },
            change: function (): void {
                throw new Error("Function not implemented.")
            }
        }
        return r
    }
    textLens(table: string, id: number) {
        const r : HtmlLens = {
            update: function (x: HtmlDiff): HtmlDiff {
                throw new Error("Function not implemented.")
            },
            change: function (): void {
                throw new Error("Function not implemented.")
            }
        }
        return r
    }

}
export type HtmlLens = {
    update: (x: HtmlDiff) => HtmlDiff
    change: Accessor<void>
}
export type TextLens = {
    update: (x: HtmlDiff) => HtmlDiff
    change: Accessor<void>  
}

// signal will be called when 
export function createConsensus(signal: ()=>void, query: Promise<[string,number]>) : Changefn {
    return (e: HtmlDiff) => {

        return e
    }
}

// we create a dedicated worker when we become leader
// we stay leader until this tab is closed.
let dbw: SendToWorker | undefined
type UpdateRangeEvent = {
    method: 'updateRange'
    params: {
        handle: number
    }
}

function callbackApi(db: Db): Api {
    return {

        update: async (context: ListenerContext<any>, params: any) => {
            const { handle, diff } = params
            const rs = db.range.get(handle)
            if (rs) {
                rs.listener(diff)
            }
        },
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
}
// messages that come back from db worker need to be sent to shared worker


// always global, because shared worker is global
let sharedWorker: SendToWorker | undefined




// makeCell(cellTemplate)
// we could have a query return cellTempate[]? more like it takes that as argument

// queries return lenses? select lens(name) 
export interface Queryx {
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
    query: Queryx
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



