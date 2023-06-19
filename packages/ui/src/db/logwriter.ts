

// this could eventually moved to shared array buffer

import { concat } from "lodash"
import { Channel, Peer } from "../abc/rpc"
import { Tx } from "../lib/db"
import { CommitApi, Etx, SubscriberApi, TxBuilder, TxBulk, Txc, subscriberApi } from "./mvr_shared"

// serialize instructions to a buffer
// for each site.server there is a log

// operations
// table, primary key, attr, id, ins, del, replace, load,
// store potentially




// inside of that we write op=table,primarykey, attr, o

enum Op {
    Table = 1,
    PrimaryKey,
    Attr,
    Id,
    Ins,
    Del,
    Replace,
    Load,
}

// we need to read the global log by transaction and apply it to global values
// we need to read the local log when we are reconciling with the leader
// we need to read the local log to recover after starting up.

// to use pure delta ops we need to a snapshot of each device state, is it worth it?
// maybe there can be a clear operation inserted when a connection is made 

// can this read bulk and non-bulk together? does it need to? wouldn't it tear transactions if the bulk was accepted locally in a different order, or can we just put a promise in there?

class Reader {

    async read()  {
        const reader = this.tx.getReader()
       const r = await reader.read()
        //this.tx = tx
    }

    constructor(public tx: ReadableStream) {

    }

    
}

// we need to be able read and rewrite the tail of the log to reach consensus on ordering
export class Writer {
    b = new Uint8Array(16384)
    all : Uint8Array[] = []
    pos = 0
    te = new TextEncoder()

    emit(op: number){

    }
    emitstr(op: string){

    }
    emitb(data: Uint8Array) {

    }
    writeOp(op: number ){
        this.b[this.pos++] = op

    }
}

class LockClient {
    api: SubscriberApi
    constructor(ch: Channel) {
        this.api = subscriberApi(new Peer(ch))
    }
}


// a  remote log chunk of operations. Some will succeed and some will fail
// we will return a list of the ones that failed to be retried.

function packBits(bits: boolean[]): Uint32Array {
    const r = new Uint32Array(Math.ceil(bits.length / 32))
    for (let i = 0; i < bits.length; i++) {
        if (bits[i]) {
            r[i >> 5] |= 1 << (i & 31)
        }   
    }
    return r
}

function transformToTx(x: ReadableStream ) : ReadableStream<Tx|TxBulk> {
    return x
}
// reconciler for each site?
export class Reconciler {
    log = new Map<number, Uint8Array>()
    client = new Set<LockClient>()
   lock = new Map<number, Map<number, number>>()

    connectWebrtc(ch: Channel): CommitApi {
        const r1: CommitApi = {
            commit: this.acceptRemoteCommits.bind(this),
        }
        this.client.add(new LockClient(ch))
        return r1
    }

    disconnectWebRtc(ch: Channel): void {
        this.client.delete(new LockClient(ch))
    }
 
    // if we are taking a stream of txs can we stream back the accepts?
    async acceptRemoteCommits(tx: ReadableStream<Uint8Array>): Promise<Uint32Array> {
        const txs =   transformToTx(tx)
        const r : boolean[] = []
        const rdr = new Reader(tx)

        const lockmap = this.lock.get(tx.id)
        if (!lockmap) { return -a }

        for (let lk of tx.lock) {
            const v = lockmap.get(lk)
            if (v && v != tx.lockValue[0]) {
                return -1
            }
        }
        for (let lk of tx.lock) {
            lockmap.set(lk, tx.lockValue[0] + 1)
        }

        let log = this.log.get(tx.id)
        if (!log) {
            log = new Uint8Array(0)
        }
        log = concat(log, tx.data)
        this.log.set(tx.id, log)

        return packBits(r)
    }

    async proposeRemoteCommits(){
        // read the tail of the log and propose them to the leader
        // transactions that are rejected are rebased and retried
        // we write the accepts/reject/rebase to our log
    }

    async acceptLocalCommit(lc: LocalCommit){

    }

    // when we start up we need to read the log and apply it to our btree
    // can I use leanstore style aries here? or only roll forward?
    async recover() {
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
export async function insert_file(tx: TxBuilder|TxBulk, path: string, f: File) {

}

// using global functions allows us to overload the function name?



