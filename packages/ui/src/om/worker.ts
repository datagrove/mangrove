
import { Channel, Service, apiSet } from '../abc/rpc';
import { createSharedListener } from '../abc/shared';
import { DocState, Op, Peer as OmPeer } from './om';


export interface BufferApi {
    update(ops: Op[]): void
}
export function bufferApi(ch: Channel): BufferApi {
    return apiSet(ch, "update")
}
class BufferClient {
    peer = new OmPeer()
    constructor(public api: BufferApi) {

    }
}

class PeerServer implements Service {
    cl = new Map<Channel, BufferClient>();
    ds = new DocState();
    rev = 0

    connect(ch: Channel): BufferApi {
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
    disconnect(ch: Channel): void {
        this.cl.delete(ch);
    }
}

createSharedListener(new PeerServer())