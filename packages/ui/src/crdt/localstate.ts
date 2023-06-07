import { capability } from "@ucans/ucans"
import { SendToWorker } from "../worker/useworker"
import { Setter, Signal } from "solid-js"
import {  Op } from "./crdt"
import { Channel, Peer, Rpc } from "./cloud"
import { accept } from './client'
import { TabState } from "./tabstate"
import { LocalStateClient, TabStateClient } from "./localstate_shared"

import { JsonPatch } from "../lexical/sync"


// sharedworker to share all the localstate.

// each local state will be connected to multiple hosts.
// it may also be disconnect from some hosts and connected to others.

// interface used for the host to connect with the editor

// for testing it would be nice to have it not in a shared worker, what will that take?

class Client {
    peer: Peer<TabStateClient>
}



export class LocalState {
   

	// this will be a message channel to the worker
	// we can make this recover from a dedicated worker closing directly or we can mediate through a shared worker. Is there noticeable latency in the latter? we can probably even do some direct state management in the shared worker, but we won't have a socket there, only a message channel to the leader's dedicated worker.
	constructor() {
	}
	// each tab will have a message channel 
	tab = new Set<Client>()

	connect(mc: Channel)  {
        this.tab.add(accept<TabStateClient>(mc))

        // connector will use this interface. we could also return a zod parser here.
        // there is an asymmetry, how do we handle signals across the channel?

        return {
            subscribe(props: Subscribe ){
                const p = props.params 
                if (p.path[0] !== '/') {
                    props.error(400, 'path must start with /')
                    return
                }
                props.reply( {
                    handle: 0,
                    doc: {},
                })
            },
            publish(props: Publish){
                return props.params.patch
            }
        }
	}
    disconnect(mc: Channel) {

    }



    // this can just queue and reply when the worker comes back
    onrpr(ch: Channel, method: string, id: number, params: any){

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


