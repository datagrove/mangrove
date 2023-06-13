
import { Channel, Service, apiCall } from '../abc/rpc';
import { createSharedListener } from '../abc/shared';
import { DocState, Op, OmPeer as OmPeer } from './om';

// call back to client with new ops, or new path open.
export interface BufferClientApi {
    update(ops: Op[]): void
}
export interface BufferApi {
    update(ops: Op[]): void
}
export function bufferApi(ch: Channel): BufferApi {
    return apiCall(ch, "update")
}


class BufferClient {
    peer = new OmPeer()
    constructor(public api: BufferApi) {

    }
}

interface ServiceApi {
    openDoc(path: string): BufferApi
    
}

class PeerServer implements Service {
    cl = new Map<Channel, BufferClient>();
    ds = new DocState();
    rev = 0

    connectDoc(ch: Channel): BufferApi {
        const c = new BufferClient(bufferApi(ch))
        this.cl.set(ch, c)
        const r: BufferApi = {
            update: (ops: Op[]) => {
                for (var i = 0; i < ops.length; i++) {
                    c.peer.merge_op(this.ds, ops[i]);
                }
                if (this.rev < this.ds.ops.length) {
                    for (let o of this.cl.values()) {
                        o.api.update(this.ds.ops.slice(this.rev))
                    }
                    this.rev = this.ds.ops.length;
                }
            }
        }
        return r
    }
    // one per tab
    connect(ch: Channel): ServiceApi {
        return {

        }
        return this.connectDoc(ch)
    }
    disconnect(ch: Channel): void {
        this.cl.delete(ch);
    }
}

createSharedListener(new PeerServer())