import { ApiSet, Channel, WorkerChannel } from "../abc/rpc"
import { HostClient, KeeperClient, LocalStateClient, Scan, Stat, TabStateClient, TabStateClientApi } from "./localstate_shared"
import { DbLiteClient, DbLiteClientApi } from "../dblite/api"
import { editor_schema } from "./editor_schema"
import { encode } from "cbor-x";
import { log } from "console";
import { IntervalTree } from "./itree";
import { ScanQuery, ScanDiff, binarySearch } from "./localstate_shared";
import { QuerySchema, Keyed, TableUpdate, Tx } from "../dblite/schema";

export function mapCache<K, V>(m: Map<K, V>, url: K, fn: (x: K) => V): V {
    let sx = m.get(url)
    if (!sx) {
        sx = fn(url)
        m.set(url, sx)
    }
    return sx
}

interface Subscription {
    ctx: Client
    query: ScanQuery<any, any>
    cache: Keyed[]
    lastSent: Keyed[] // use this for diff,
}
// each local state will be connected to multiple hosts.
// it may also be disconnected from some hosts and connected to others.
// 

// interface used for the host to connect with the editor

// for testing it would be nice to have it not in a shared worker, what will that take?

// we'll make everything go through the shared worker initially, then we'll probably make paths for large objects to pass through SharedArrayBuffer

class Client {
    leader: boolean = false
    constructor(public api: TabStateClient) {

    }
    cache = new Map<number, Subscription>()
}
class Site {
    sub = new Set<Client>
}
// LocalState requires a Keeper Client and a Host Client

export interface LocalStateConfig {
    cloud?: (url: string) => Channel
    host?: HostClient,
    keeper?: KeeperClient
    db?: DbLiteClient
}

// this is all accessed from the worker thread
interface Structured {
    attribute: { [key: string]: string }
    children: Structured[]
}
interface Tuple {
    _id: number,  // globally or universally unique id. universal is obtained  from the host
    _uid: number, // universal id.
    _table: string,
    [key: string]: number | string | Structured
}
interface PinnedTuple {
    server: Tuple
    editor: Tuple
}
class Server {
    // there is an glsn per server, otherwise it would be hard for server to know if any are missing
    glsn = 0
    // we have a tree per table, this lets us cache/hash the top cheaply.
    site: {
        [site: string]: {
            [table: string]: {
                pinned: IntervalTree<Subscription>
                dirty: {
                    [key: number]: PinnedTuple
                }
            }
        }
    } = {}

    avail = new Map<string, number>()

    constructor(public url: string) {
    }
}
export class LocalState {
    // each tab will have a message channel 
    db?: DbLiteClient
    dbi?: DbLiteClient
    tab = new Map<Channel, Client>()
    handle = new Map<string, Site>()
    nextHandle: number = 42
    server = new Map<string, Server>()
    constructor(config: LocalStateConfig) {
    }

    sv(url: string): Server {
        let sx = this.server.get(url)
        if (!sx) {
            sx = new Server(url)
            this.server.set(url, sx)
        }
        return sx
    }
    // connect returns an server-side api from a channel
    // if the client side has an api, it is created here as well 
    connect(mc: Channel): ApiSet {
        const cl = new Client(TabStateClientApi(mc))
        this.tab.set(mc, cl)

        // seems like this has to cost something? how clever is the javascript engine?
        const api: LocalStateClient = {
            scan:  async <T = any>(scan: Scan<any>): Promise<string | T[]> =>{
                
            },
            commit: async (tx: Tx): Promise<string | undefined> => {
                // lots to do here! we need to build a packet to write to the keeper, sequence it with the host, check our own interval tree to see who's watching it.
                this.commit(cl, tx)
                return
            },

            exec:  async <T = any>(sql: string, params?: any): Promise<string | T[]> =>{
                // just pass through to DbLiteClient
                const db = await this.getDb()
                return db.exec(sql, params) 
            },
            unload: async () : Promise<void> => {
                this.disconnect(mc)
                return
            }
        }


        return api
    }

    async getDb() : Promise<DbLiteClient> {
        if (!this.db) {
            const cl: Client = this.tab.values().next().value;
            cl.leader = true
            const ch = new WorkerChannel(await cl.api.getDb(editor_schema))
            this.db =  DbLiteClientApi(ch)
        } 
        return this.db!  
    }

    // connector will use this interface. we could also return a zod parser here.
    // there is an asymmetry, how do we handle signals across the channel?


    async disconnect(mc: Channel) {
        // close all subscriptions
        let ts = this.tab.get(mc)
        if (!ts) return
        for (const s of ts.cache.keys()) {
            this.close(ts, s)
        }1
        this.tab.delete(mc)
        if (ts.leader) {
            this.db = await this.getDb()
        }
    }

    // sharedworker to share all the localstate.
    // one tab will be selected as leader to create the dedicated opfs worker
    // chrome may fix this problem, or maybe a future db can manage without a dedicated worker.
    getTable(server: string, site: string, table: string): IntervalTree<Subscription> {
        let s = this.sv(server)
        let st = s.site[site]
        if (!st) {
            st = {}
            s.site[site] = st
        }
        let t = st[table]
        if (!t) {
            // we need to create the table
            st[table].pinned = new IntervalTree<Subscription>()
        }
        return t.pinned
    }

    close(ts: Client, h: number) {
        // delete the record from the tabstate, we keep this list for cleanup when tab disconnects, it may be unnecessary? unclear if tab will be allowed to notify and send us this list.
        const sub = ts.cache.get(h)
        if (!sub) return
        ts.cache.delete(h)

        const tr = this.getTable(sub.query.server, sub.query.site, sub.query.table)
        if (tr)
            tr.remove(sub.query.from_, sub.query.to_, sub)
    }


    // we know that these tuples are loaded in the subscription
    execOps(tbl: IntervalTree<Subscription>, table: string, upd: TableUpdate, dirty: Set<Subscription>) {

        // to find the key in our cache we need to encode it
        const v: QuerySchema<any> = editor_schema.view[table]
        const keystr = v.marshalKey(upd.tuple)

        // we need collect the subscriptions, update all at once.
        const sub: Subscription[] = tbl.stab(keystr)
        sub.forEach(s => dirty.add(s))


        switch (upd.op) {
            case 'insert':
                break;
            case 'delete':
                break;
            case 'update':
                break;
        }

        // update is read-modify-write
        const updateSql = (row: unknown) => {
            // we need to run the functors on this. how does crdt fit here
            // it may need to write a file, so we should probably give the functor
            // a context. it might be good to have a functor that can do the whole
            // update in sql.
            const updated = editor_schema.functor[upd.op](row, upd.tuple)
            // we need to update the database
            const sql = v.marshalWrite1(updated)
            this.db?.exec({
                sql: sql[0],
                bind: sql.slice(1),
            })
            return updated
        }

        if (sub.length === 0) {
            // we need to read the record from the database to do the merge
            const r = v.marshalRead1(upd.tuple)
            this.db?.exec({
                sql: r[0],
                bind: r.slice(1),
                callback: (row: any) => {
                    updateSql(row)
                }
            })
        } else {
            // find the key in the first matching subscription, it will be the same in all of the matching. here we don't need to do the read, we can just do the write.
            // update all of them
            const s = sub[0]
            const n = binarySearch(s.cache, keystr)
            if (n >= 0) {
                // found it, update and notify
                const upd = updateSql(s.cache[n])

                sub.forEach(s => {
                    const n = binarySearch(s.cache, keystr)
                    if (n >= 0) {
                        // 
                    }
                })
            }

        }
        // store

    }


    // maybe a shared array buffer would be cheaper? every tab could process in parallel their own ranges
    // unlikely; one tree should save power.
    // we optimistically execute the query locally, and multicast the results to listeners
    // server can proceed at its own pase.
    commit( cl: Client, tx: Tx) {
        // insert tx into our 
        const svr = this.sv(tx.server)
        if (!svr) return

        // how do we rebase if we fail?
        log("commit", tx)
        this.db?.exec("insert into log(server, entry) values (?,?)",
            [tx.server, encode(tx)])


        // stab with all the keys, then broadcast all the updated ranges.
        const site = svr.site[tx.site]
        if (!site) {
            console.log("site not found", tx.site)
            return
        }

        const dirty = new Set<Subscription>()
        for (const [table, upd] of Object.entries(tx.table)) {
            const tbl = site[table]
            if (!tbl) continue
            upd.forEach((x: TableUpdate) => {
                this.execOps(tbl.pinned, table, x, dirty)
            })
        }

    }

    updateSubscription(subs: Set<Subscription>) {
        for (const sub of subs) {
            const diff: ScanDiff = computeDiff(sub.lastSent, sub.cache)
            sub.lastSent = applyDiff(sub.lastSent, diff)
            sub.ctx.api.update(sub.query.handle, diff)
        }
    }


}


function computeDiff(old: Keyed[], newer: Keyed[]): ScanDiff {
    const compare = (a: string, b: string) => a.localeCompare(b);
    let d: ScanDiff = {
        tuple: [],
        copy: [],
        size: 0,
    };
    let i = 0;
    let j = 0;
    while (i < old.length && j < newer.length) {
        const c = compare(old[i]._key, newer[j]._key);
        if (c < 0) {
            const k = i++;
            while (i < old.length && compare(old[i]._key, newer[j]._key) < 0) i++;
            d.copy.push({ which: 0, start: k, end: i });
        } else if (c > 0) {
            const k = i++;
            let st = d.tuple.length;
            while (j < newer.length && compare(old[i]._key, newer[j]._key) > 0) {
                d.tuple.push(newer[j++]);
                d.copy.push({ which: 1, start: j, end: j + 1 });
            }
            d.copy.push({ which: 1, start: j, end: i });
        } else {
            d.copy.push({ which: 1, start: j, end: j + 1 });
            d.tuple.push(newer[j++]);
            i++;
        }
    }
    while (j < newer.length) {
        d.tuple.push(newer[j++]);
        d.copy.push({ which: 1, start: j, end: j + 1 });
    }
    while (i < old.length) {
        d.copy.push({ which: 0, start: i, end: i + 1 });
        i++;
    }
    d.size = d.tuple.length + d.copy.length;
    return d;
}

function applyDiff(old: Keyed[], diff: ScanDiff): Keyed[] {
    const result: Keyed[] = [];
    let i = 0;
    let j = 0;
    for (const op of diff.copy) {
        if (op.which === 0) {
            for (let k = op.start; k < op.end; k++) {
                result.push(old[k]);
            }
        } else {
            for (let k = op.start; k < op.end; k++) {
                result.push(diff.tuple[j++]);
            }
        }
    }
    return result;
}