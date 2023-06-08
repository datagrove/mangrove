import { ApiSet, Channel } from "./rpc"
import { Err, HostClient, KeeperClient, LocalStateClient, Scan, Stat, TabStateClient, TabStateClientApi } from "./localstate_shared"

import { JsonPatch } from "../lexical/sync"
import { Tx } from "../db"


// sharedworker to share all the localstate.
// one tab will be selected as leader to create the dedicated opfs worker
// chrome may fix this problem, or maybe a future db can manage without a dedicated worker.



// each local state will be connected to multiple hosts.
// it may also be disconnected from some hosts and connected to others.
// 

// interface used for the host to connect with the editor

// for testing it would be nice to have it not in a shared worker, what will that take?


// we'll make everything go through the shared worker initially, then we'll probably make paths for large objects to pass through SharedArrayBuffer

class Client {
    constructor(public api: TabStateClient){

    }
  
}
class Site {
   sub = new Set<Client>
}
// LocalState requires a Keeper Client and a Host Client

export interface LocalStateConfig {
    cloud?: (url: string) => Channel
    host?: HostClient,
    keeper?: KeeperClient
}

export class LocalState {
	constructor(config: LocalStateConfig) {
	}
	// each tab will have a message channel 
	tab = new Map<Channel, Client>()
    handle = new Map<string, Site>()
    nextHandle : number = 42

    // connect returns an server-side api from a channel
    // if the client side has an api, it is created here as well 
	connect(mc: Channel) : ApiSet {
        // seems like this has to cost something? how clever is the javascript engine?
        const api : LocalStateClient = {
            scan: function <T = any>(scan: Scan<any>): Promise<string | T[]> {
                throw new Error("Function not implemented.")
            },
            query: function <T = any>(sql: string, params?: any): Promise<string | T[]> {
                throw new Error("Function not implemented.")
            },
            lens: function (table: string, id: number): Promise<string | number> {
                throw new Error("Function not implemented.")
            },
            commit: function (tx: Tx): Promise<string | undefined> {
                throw new Error("Function not implemented.")
            }
        }
        
        this.tab.set(mc, new Client(TabStateClientApi(mc))) 
        return api
    }

    // connector will use this interface. we could also return a zod parser here.
    // there is an asymmetry, how do we handle signals across the channel?


    disconnect(mc: Channel) {
        this.tab.delete(mc)
    }

}


