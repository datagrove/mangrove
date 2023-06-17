import { Peer, WorkerChannel } from '../abc/rpc';
import { RangeSubscriber, ScanQuery, Tuple, Tx, rangeSubscriberApi } from './mvr_shared';
const ctx = self as any;

// global, each worker has a single database

// when we start a worker we should give a message channel that allows it to access the main console log? un


// servers can require drivers to support their storage
// servers. When contacting the host, the driver can be negotiated; the host can offer more than one driver.
export interface ServerDriver {
    // read is not generally authorized, as the data is already encrypted. There are few threat models where this would be useful
    readPage(id: string, credential: Uint8Array | null): Promise<Uint8Array>

    // writes generally need to be authorized because they must share a bucket in popular cloud services.
    writePage(id: string, credential: Uint8Array | null, data: Uint8Array): Promise<string>

    authorize?: (id: string, credential: Uint8Array) => Promise<Uint8Array | null>


}

export class TestServerClient implements ServerDriver {
    data = new Map<string, Uint8Array>()
    async readPage(id: string, credential: Uint8Array | null): Promise<Uint8Array> {
        return this.data.get(id)!
    }
    async writePage(id: string, credential: Uint8Array | null, data: Uint8Array): Promise<string> {
        this.data.set(id, data)
        return ""
    }

    static async create(config: any): Promise<Peer> {
        throw new Error("not implemented")
    }
}

type DriverMap = {
    [key: string]: (config: any) => Promise<Peer>
}


// this can return a peer that implements the ServerDriver interface.
export const drivers: {} = {
    "test": (config: any) => TestServerClient.create(config)
}

export interface PinnedTuple {
    server: Tuple
    editor: Tuple
}



// I can rate limit this; send no more than 10fps. combine the diffs
// function updateSubscription(subs: Set<Subscription>)  {
//     for (const sub of subs) {
//         const diff = computeDiff(sub.lastSent, sub.cache)
//         sub.lastSent = applyDiff(sub.lastSent, diff)
//         sub.ctx.write({
//             method: 'update',
//             params: {
//                 query: sub.query.handle,
//                 diff
//             }
//         })
//     }
// }



// subscriptions are going to be tied to message port.
export class Subscription {
    constructor(public query: ScanQuery<any, any>, mp: MessagePort) {
        this.api = rangeSubscriberApi(new Peer(new WorkerChannel(mp)))
    }
    cache: Keyed[] = []
    lastSent: Keyed[] = [] // use this for diff,
    api: RangeSubscriber
}

export class DgServer {
    constructor() {

    }

    // these can't fail; they always just apply the delta from the server and advance the universal version number. If the tuple has been pinned then we let the editors that pinned it known and send them the delta or new value. which one is specified in the pin command.
    async syncFromServer(tx: Tx) {

    }

    _next = 0
    async getIds(n: number): Promise<number[]> {

        // get these from the server though.
        let a = new Array<number>(n)
        for (let i = 0; i < n; i++)
            a[0] = this._next++
        return a
    }

    // we need to read a list of servers that need syncup
    async reconcile() {

        let pr: Promise<any>[] = []
        let servers: string[] = []

        for (let s of servers) {

            //syncUp(te, s, site)
        }
        await Promise.all(pr)
    }

    async synchUp(server: string, site: string) {
        // if we have new local nodes, we first get a global  id for them
        // get a list of dirty tuples for this server. If any new insertions, get ids for them.

        //const tx = db.begin("","")
        "select lsn, tx  from unsynched"
        // decode, get the inserts, modify them into updates against new allocated gid.
        "update {table} set gid=? where id=?"
        "update dirty set gid=? where id=?"
        // tx.commit()

        const siteCommit = (): Promise<[boolean, number]> => {
            throw new Error("not implemented")
        }

        // we can send a windo, but transactions after a failed transactions are ignored. it seems somewhat easier to reason about
        // if we only apply the transactions in order.
        for (let i = 0; i < 10; i++) {
            const [ok, siteVersion] = await siteCommit()
            if (!ok) {
                // a failure may advance our version of the site.
                // before starting again we need to wait until reconcile down 
                // maybe update a record here noting we are blocked until down synced?
                "update site set lastKnownVersion=? where site=?"
                return

            }
        }


        // 
        "delete from local where id = ?"

    }


}