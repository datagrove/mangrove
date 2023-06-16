
interface Etx {
    id: number
    data: Uint8Array
    lock: number[]
    lockValue: number[]
}
interface AuthApi {
    login(challenge: Uint8Array, user: string, response: Uint8Array): Promise<void>
}
interface CommitApi {
    commit(tx: Etx): Promise<number>
}
// subscribe is a commit to the user database.

interface SubscriberApi {
    sync(length: number) : Promise<void>
}
interface KeeperApi {
    read(id: number, at: number, size: number): Promise<Uint8Array|string>
}

function concat(a: Uint8Array, b: Uint8Array) {
    var c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c
}

const tostr = async (data:Uint8Array) : Promise<string> => {
    // Use a FileReader to generate a base64 data URI
    const base64url = (await new Promise((r) => {
        const reader = new FileReader()
        reader.onload = () => r(reader.result as any)
        reader.readAsDataURL(new Blob([data]))
    }) )as string

    /*
    The result looks like 
    "data:application/octet-stream;base64,<your base64 data>", 
    so we split off the beginning:
    */
    return base64url.substring(base64url.indexOf(',')+1)
}

class SiteLog {
    data = new Uint8Array(0)
    append(data: Uint8Array) {
        this.data =  concat(this.data, data)
    }
}
class Keeper {
    site = new Map<string, SiteLog>()
}

class LockServer implements KeeperApi, CommitApi{

    async read(id: number, at: number, limit: number): Promise<string | Uint8Array> {
        const lg = this.log.get(id)
        if (!lg) {
            return "not found"
        }
        return lg.slice(at, at+limit)        
    }
    // this could just be a write to a log that tne server can read.
    // 


    lock = new Map<number, Map<number,number>>()
    log = new Map<number, Uint8Array>()
    watchers = new Map<string, Uint8Array>()

    async commit(tx: Etx) : Promise<number> {
        const lockmap = this.lock.get(tx.id)
        if (!lockmap) { return -a}      

        for (let lk of tx.lock) {
            const v = lockmap.get(lk)
            if (v && v != tx.lockValue[0]) {
                return -1
            }
        }
        for (let lk of tx.lock) {
            lockmap.set(lk, tx.lockValue[0]+1)
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