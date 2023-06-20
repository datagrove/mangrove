

// this could eventually moved to shared array buffer

import { Channel, Peer, WsChannel, apiListen } from "../abc/rpc"
import { CloudApi, LesseeApi, PeerApi, TxBuilder, TxBulk, cloudApi, peerApi } from "./mvr_shared"
import { SiteTracker, MvrServer } from "./mvr_worker"

// serialize instructions to a buffer
// for each site.server there is a log

// operations
// table, primary key, attr, id, ins, del, replace, load,
// store potentially



// inside of that we write op=table,primarykey, attr, o

enum Opcode {
    Table = 1,
    PrimaryKey,
    Attr,
    Id,
    Ins,
    Del,
    Replace,
    Load,
    Version
}
type Op = [Opcode, string | number | Uint8Array]

function parseTx(tx: Uint8Array): Op[] {
    return []
}
interface Log {
    host: string // maybe empty, in which case this is the host
    site: number
    log: number  // eatch table is part of a log 
}

// we need to read the global log by transaction and apply it to global values
// we need to read the local log when we are reconciling with the leader
// we need to read the local log to recover after starting up.

// to use pure delta ops we need to a snapshot of each device state, is it worth it?
// maybe there can be a clear operation inserted when a connection is made 

// can this read bulk and non-bulk together? does it need to? wouldn't it tear transactions if the bulk was accepted locally in a different order, or can we just put a promise in there?

// is it a hassle when a transaction fails to re-establish the state?
// is it problematic to rebase from this kind of log?
class TxState {
    key: number = 0
    method: number = 0
    author: number = 0
    id: number = 0
    op: Opcode = Opcode.Table
    value: string = ""
    pos: number = 0
}
class Reader extends TxState {

    async read() {
        const reader = this.tx.getReader()
        const r = await reader.read()
        //this.tx = tx
    }

    constructor(public tx: ReadableStream) {
        super()
    }
}

// we need to be able read and rewrite the tail of the log to reach consensus on ordering
export class Writer {
    b = new Uint8Array(16384)
    all: Uint8Array[] = []
    pos = 0
    te = new TextEncoder()

    emit(op: number) {

    }
    emitstr(op: string) {

    }
    emitb(data: Uint8Array) {

    }
    writeOp(op: number) {
        this.b[this.pos++] = op

    }
}


// peers may be leaders or users.
export class RecPeer {
    api: PeerApi
    authLog = new Set<string>()
    constructor(public rec: MvrServer, ch: Channel) {
        this.api = peerApi(new Peer(ch))
    }
    site = new Map<number, SiteTracker>()

    // we are notif
    onNotify(id: number, stream: number,  at: number, d: Uint8Array) {
        const site = this.site.get(id)
        if (site) {
            site.onNotify(stream, at, d)
        }
    }

    getApi() {
        return this.api
    }

    close() {
    }
    // these are always accepted
    async acceptRemoteBlob(lg: SiteTracker, blob: Uint8Array): Promise<[number, string]> {
        return [1, ""]
    }
    // returns location of first error and the error code
    async acceptRemoteCommits(lg: Log, txx: Uint8Array): Promise<[number, string]> {
        // does aeron style transfer buy us anything here other than more work?
        return [0, ""]
        // check authorization the first time we see a log.

        // each block may be a write to a blob, or 1+ transactions.

        switch (txx[0]) {
            case 0:
            // return this.rec.acceptRemoteBlob(lg, txx)
        }

        // this can parse to ops, we can flip a bit on commit ops. 
        const tx: Op[] = parseTx(txx)
        for (let t of tx) {
            switch (t[0]) {
                case Opcode.Version:
                // we need to make sure that the submitter has seen all the updates
                // if not, then this transaction fails

            }
        }

        // const lockmap = this.lock.get(tx.id)
        // if (!lockmap) { return -a }

        // for (let lk of tx.lock) {
        //     const v = lockmap.get(lk)
        //     if (v && v != tx.lockValue[0]) {
        //         return -1
        //     }
        // }
        // for (let lk of tx.lock) {
        //     lockmap.set(lk, tx.lockValue[0] + 1)
        // }

        // let log = this.log.get(tx.id)
        // if (!log) {
        //     log = new Uint8Array(0)
        // }
        // log = concat(log, tx.data)
        // this.log.set(tx.id, log)

        // return packBits(r)
    }
}


// a  remote log chunk of operations. Some will succeed and some will fail
// we will return a list of the ones that failed to be retried.




// we don't want to keep a connection to the host unless we are the leader.
export class Host {
    api: CloudApi

    async findLeader() : Promise<[boolean,RecPeer|undefined]> {
        return [false, undefined]
    }
    constructor(public ps: MvrServer, public host: string) {
        let ch = new WsChannel(this.host)
        let peer = new Peer(ch)
        this. api = cloudApi(peer)

        const r : LesseeApi = {
            revoke: function (lease: number): Promise<void> {
                throw new Error('Function not implemented.');
            },
            nack: function (lease: number): Promise<void> {
                throw new Error('Function not implemented.');
            }
        }
        apiListen<LesseeApi>(peer,  r)
    }

}


// something that conveniently comes from the editor. Most should be in the form of tree edits since each value is a json-like tree. Some will be imports of various kinds: csv, json, etc. copy/paste things. Big imports need to allow interleaving with other operations, maybe adopt umbra's approach of 1 bulk operation at a time?

export interface LocalCommit {

}

// maybe these should not be single shot because they need a lock anyway?
export interface BulkCommitx {
    x: ReadableStream
}

// we need a class exposed in the tab that can manage the bulk commit: get the lock, write the commit, release the lock. If the tab is closed we need to find a way to make sure the lock is released.

// this is going to write massive blobs, column organized data like parquet, maybe maps,
// 



// we can get a bulk commit from the tab state, although  we want to use this functionality from a cli, so the tabstate is the wrapper.

// generated functions should allow bulk commit as target

// we potentially need progress for large files. a call back is the most general, map to signals elsewhere? probably more performant to just set up an animation loop to poll?
export async function insert_file(tx: TxBuilder | TxBulk, path: string, f: File) {

}

// using global functions allows us to overload the function name?



