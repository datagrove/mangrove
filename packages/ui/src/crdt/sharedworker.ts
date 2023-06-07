import { capability } from "@ucans/ucans"
import { SendToWorker } from "../worker/useworker"
import { Signal } from "solid-js"


// these are peers, server can call back to client 

// each local state will be connected to multiple hosts.
// it may also be disconnect from some hosts and connected to others.



class LocalState<T implements Cloud> {
    const host = new Set<Peer>()

	// this will be a message channel to the worker
	// we can make this recover from a dedicated worker closing directly or we can mediate through a shared worker. Is there noticeable latency in the latter? we can probably even do some direct state management in the shared worker, but we won't have a socket there, only a message channel to the leader's dedicated worker.
	constructor() {
	}
	// each tab will have a message channel 
	tab = new Set<Peer>()
	connect(mc: MessageChannel) {

	}

    addChannel(peer: Peer){
		this.tab.add(peer)

    }

    // this can just queue and reply when the worker comes back
    rpc(ch: Channel, method: string, id: number, params: any){

    }

}

export interface LocalStateClient {
    publish(path: string, ops: Op[]) : Promise<void>
}
export interface LocalStateClientCallback {

}

// each similulated tab will create a shared worker, but
// in a simulated domain. builds a peer around message channel

const sw = new Map<string, SharedWorker>()

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

/*
mc.port2.onmessage = (e) => {
    const { method, params , id} = e.data
    switch (method) {
        case 'write':
            break
        case 'open':
            break
        case 'close':
            break
    }
}
*/