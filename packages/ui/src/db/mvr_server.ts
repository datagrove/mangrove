import { ne } from "@faker-js/faker";
import { Channel, Peer, Service } from "../abc/rpc";
import { CommitApi, Etx, SubscriberApi, subscriberApi } from "./mvr_shared";

function concat(a: Uint8Array, b: Uint8Array) {
    var c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c
}

const tostr = async (data: Uint8Array): Promise<string> => {
    // Use a FileReader to generate a base64 data URI
    const base64url = (await new Promise((r) => {
        const reader = new FileReader()
        reader.onload = () => r(reader.result as any)
        reader.readAsDataURL(new Blob([data]))
    })) as string

    /*
    The result looks like 
    "data:application/octet-stream;base64,<your base64 data>", 
    so we split off the beginning:
    */
    return base64url.substring(base64url.indexOf(',') + 1)
}

class SiteLog {
    data = new Uint8Array(0)
    append(data: Uint8Array) {
        this.data = concat(this.data, data)
    }
}
class Keeper {
    site = new Map<string, SiteLog>()
}

// maybe it doesn't implement service because no connection?
// what does cors do to us? do we need to send everything through a proxy or a worker?
// if we do should we keep connections?
// even if there is a proxy, it doesn't change the nature of the service.



// subscribe is a form of commit
// notification time is sent when the subscribe log changes, but user still needs to fetch the snapshot to read the sites that were updated. The lock server writes the snapshot. The lock server will also write n focused site updates in the notification, so the client can read these log items with fewer round trips. 

// cost-wise we may want the tail service to be on a different host than the rest of the log.

class LockClient {
    api: SubscriberApi
    constructor(ch: Channel) {
        this.api = subscriberApi(new Peer(ch))
    }
}

export class LockServer implements Service {
    client = new Set<LockClient>()
    lock = new Map<number, Map<number, number>>()
    log = new Map<number, Uint8Array>()
    watchers = new Map<string, Uint8Array>()


    connect(ch: Channel): CommitApi  {
        const r1: CommitApi = {
            commit: this.commit.bind(this),
        }
        this.client.add(new LockClient(ch))
        return r1
    }

    disconnect(ch: Channel): void {
        this.client.delete(new LockClient(ch))
    }

    async commit(tx: Etx): Promise<number> {
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
        return log.length
    }
}

