

// maybe this just goes in the context?
const sw = new Map<string, SharedWorker>()

// TEST CLOUD //////////////////////////////////////////////////////////////////

class TestCloud implements Cloud {
    connect(url: string): Promise<Peer> {
        return this.net[url].connect()
    }
    disconnect(peer: Peer): void {
    }
    constructor(public net: {
        [key: string]: ConnectablePeer
    }){}
}


export const testCloud = new TestCloud({
    "host1":  new Host({}),
    "host2":  new Host({}),
    "keeper1":  new Keeper({}),
    "keeper2":  new Keeper({}),
})

function createSharedWorkerTest(domain: string ) : LocalStateClient {
    let w = sw.get(domain)
    if (!w) {
        w = new SharedWorker("worker.js", domain)
        sw.set(domain, w)
    }

    const mc = new MessageChannel()
    const r = new SendToWorker((data: any) => {
        mc.port2.postMessage(data)
    })
    mc.port2.onmessage = (e) => {
        const { method, params , id} = e.data   
        w.rpc(method, params).then((result) => {
            r.reply(id, result)
        }
    })
    return [r, mc]
}