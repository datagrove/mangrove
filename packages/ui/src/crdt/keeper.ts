
//  there can be more than one host, the path distinguishes the correct host
//  each host can have multiple keepers, clients can read two and the first available one cancels the other


import { read, write } from "fs"
import { disconnect } from "process"
import { start } from "repl"
import { string, number, any } from "zod"
import { Channel, ConnectablePeer } from "./cloud"
import { Peer } from "./ot_toy"

// can we use zod for this? to describe the entire api?


// clouds do not share sites, each client must connect to the correct host 
export class Keeper implements ConnectablePeer {
    constructor(config: any) {
    }

    disconnect(ch: Channel): void {
        throw new Error("Method not implemented.")
    }
    connect(ch: Channel) {
        // connectionless
        ch
        
    }
    onrpc(method: string, params: any){


    }


	store = new Map<string, any[]>()
	async read(id: string, start: number, end: number) {
		return this.store.get(id)?.slice(start, end)
	}
	async write(id: string, at: number, a: any) {
		let st = this.store.get(id)
		if (!st) {
			st = []
			this.store.set(id, st)
		}
		st.push(a)
		console.log('keeper', st)
	}
}