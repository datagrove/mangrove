import { capability } from "@ucans/ucans"
import { SendToWorker } from "../worker/useworker"
import { Setter, Signal } from "solid-js"
import {  Op } from "./crdt"
import { Channel, ConnectablePeer, Peer, Rpc } from "./cloud"
import { accept } from './client'
import { TabState } from "./tabstate"
import { LocalStateClient, TabStateClient } from "./localstate_shared"

import { JsonPatch } from "../lexical/sync"
import { Connect } from "vite"


// sharedworker to share all the localstate.

// each local state will be connected to multiple hosts.
// it may also be disconnect from some hosts and connected to others.

// interface used for the host to connect with the editor

// for testing it would be nice to have it not in a shared worker, what will that take?

class Client {
    
    constructor(peer: Peer) {

    }
}

export class LocalState {
   

	// this will be a message channel to the worker
	// we can make this recover from a dedicated worker closing directly or we can mediate through a shared worker. Is there noticeable latency in the latter? we can probably even do some direct state management in the shared worker, but we won't have a socket there, only a message channel to the leader's dedicated worker.
	constructor() {
	}
	// each tab will have a message channel 
	tab = new Set<Client>()

	connect(mc: Channel)  {
        // seems like this has to cost something? how clever is the javascript engine?
        const api = {
            async subscribe(p: {path: string} ){
                if (p.path[0] !== '/') {
                    throw new Error('path must start with /')
                    return
                }
                return {
                    handle: 0,
                    doc: {}
                }
            },
            publish(p: {handle: number, patch: JsonPatch}){
                return p.patch
            }
        }
        this.tab.add(new Client(new Peer(mc,api))) 
    }

    // connector will use this interface. we could also return a zod parser here.
    // there is an asymmetry, how do we handle signals across the channel?


    disconnect(mc: Channel) {
        this.tab.delete(mc)
    }

}






// we need to register LocalState with the cloud, let 




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


