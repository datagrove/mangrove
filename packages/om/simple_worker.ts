
import { Channel, Service, WorkerChannel, apiCall, apiListen } from '../abc/src/rpc';
import { createSharedListener } from '../abc/shared';
import { DocState, Op, OmPeer as OmPeer, OmState } from './om';
import { LensApi, lensApi } from './simple_sync_shared';

// call back to client with new ops, or new path open.

class Cl {
    peer = new OmPeer()
    constructor(public api: LensApi) { }
}
class Doc {
    ds = new OmState({})
    cl = new Set<Cl>()
    rev = 0

    update (peer: OmPeer, ops: Op[])  {
        for (var i = 0; i < ops.length; i++) {
            peer.merge_op(this.ds, ops[i]);
        }
        // I think this may be a filter, so we don't send all the messages; still needed though?
        if (this.rev < this.ds.ops.length) {
            for (let o of this.cl.values()) {
                o.api.update(this.ds.ops.slice(this.rev))
            }
            this.rev = this.ds.ops.length;
        }
    }
}
interface ServiceApi {
    open(path: string, mp: MessagePort):void
}

class PeerServer implements Service {
    ds = new Map<string,Doc>();

    open(path: string, mp: MessagePort) {
        let doc = this.ds.get(path)
        if (!doc) {
            doc = new Doc()
            this.ds.set(path, doc)
        }
        const w =  new WorkerChannel(mp) 
        const c = new Cl(lensApi(w))      
        doc.cl.add(c)
        const r: LensApi = {
            update: (ops: Op[]) => {
                doc?.update(c.peer, ops)
            }
        }
        apiListen(w, r)
    }
    // one per tab
    connect(ch: Channel) : ServiceApi{
        const r : ServiceApi = {
            open:  (path: string, mp: MessagePort) => {
                this.open(path, mp)
            }
        }
        return r
    }   
    disconnect(ch: Channel): void {
    }
}

createSharedListener(new PeerServer())