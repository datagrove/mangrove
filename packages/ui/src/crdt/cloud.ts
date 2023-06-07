import {  Cloud, ConnectablePeer, Peer } from "./crdt"


export let cloud: Cloud

// we have the actual host, then we also need to connect to it.





//  there can be more than one host, the path distinguishes the correct host
//  each host can have multiple keepers, clients can read two and the first available one cancels the other
// clouds do not share sites, each client must connect to the correct host 
class Keeper implements ConnectablePeer {
    constructor(config: any) {
    }
    connect(peer: Peer) {
        // connectionless
        const p : Peer {

        }
        return p
    }
    rpc()

    disconnect(peer: Peer): void {
        throw new Error("Method not implemented.")
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

interface HostConfig {
    cloud: Cloud
    keepers: string[]
}


export class KeeperOwner {
    constructor(public peer: Peer){

    }
    write(id: string, a: any) {
        this.peer.post({type: "write", id, a})
    }
}

// there can be multiple keepers, but only one conceptual counter.
class Host implements ConnectablePeer {
	length_ = new Map<string, number>()
    listener = new Map<string, Set<Peer>>()
    keeper : Keeper[] = []

    // unclear why we need this?
    connected = new Set<Peer>()


    constructor(public config: HostConfig) {
        this.keeper = config.keepers.map((k) => config.cloud.connect(k) as KeeperOwner)
	}

	length(id: string) {
		return this.length_.get(id) ?? 0
	}

    connect(): Promise<Peer> {
        throw new Error("Method not implemented.")
    }
    disconnect(peer: Peer): void {
        throw new Error("Method not implemented.")
    }

	write(id: string, a: any) {
		const ln = this.length(id) + 1
		let pr: Promise<any>[] = []
		for (let k of this.keeper) {
			pr.push(k.write(id, ln, a))
		}
		// really should wait for quorum
		//Promise.all(pr)

		this.length_.set(id, ln)

		for (let o of this.listener.get(id) ?? new Set<LengthListener>()) {
			//console.log("sending", o, ln)
			o(ln)
		}
	}
	addListener(id: string, l: LengthListener) {
		let ls = this.listener.get(id)
		if (!ls) {
			ls = new Set<LengthListener>()
			this.listener.set(id, ls)
		}
		ls.add(l)
		//console.log("listen", this.listener)
		l(this.length(id))
	}
	removeListener(id: string, l: LengthListener) {
		this.listener.get(id)?.delete(l)
	}
    recv(msg: any) {
    }
}



// CLIENT INTERFACE ///////////////////////////////////////////////////////////

// clients wrap around peers to provide type safety

export class KeeperClient{
    constructor(public peer: Peer){

    }


export class HostClient{
   constructor(peer: Peer){

   }
}



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