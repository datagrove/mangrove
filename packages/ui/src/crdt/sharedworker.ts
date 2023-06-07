import { capability } from "@ucans/ucans"
import { SendToWorker } from "../worker/useworker"
import { Signal } from "solid-js"
import {  Op } from "./crdt"
import { Channel } from "./cloud"


// these are peers, server can call back to client 

// each local state will be connected to multiple hosts.
// it may also be disconnect from some hosts and connected to others.

class LocalTab {

}

export class LocalState {
   

	// this will be a message channel to the worker
	// we can make this recover from a dedicated worker closing directly or we can mediate through a shared worker. Is there noticeable latency in the latter? we can probably even do some direct state management in the shared worker, but we won't have a socket there, only a message channel to the leader's dedicated worker.
	constructor() {
	}
	// each tab will have a message channel 
	tab = new Set<TabClient>()

	connect(mc: Channel) {
        this.tab.add(new TabClient(mc))
	}

    addChannel(peer: Peer){
		this.tab.add(peer)

    }

    // this can just queue and reply when the worker comes back
    rpc(ch: Channel, method: string, id: number, params: any){

    }

}




// each similulated tab will create a shared worker, but
// in a simulated domain. builds a peer around message channel





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


