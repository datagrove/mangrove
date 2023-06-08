import { KeeperClient, LocalStateClient, apiSet } from "./localstate_shared"
import { ApiSet, ConnectablePeer, Peer, WorkerChannel } from "./rpc"
import { Channel } from "./rpc"

// These are for testing. deploy the go version

// the only way this works is with the everything in one tab test version
// the localstate_worker doesn't know how to use them.
// this produces a new LocalState for each call, but it won't be in a shared worker


// clouds do not share sites, each client must connect to the correct host 
export class Keeper implements ConnectablePeer {
	store = new Map<string, any[]>()
    constructor(config?: any) {
    }

    disconnect(ch: Channel): void {
       
    }
    connect(ch: Channel) {
        // connectionless
        const r: KeeperClient = {
			read: function (path: string, start: number, end: number): Promise<string | Uint8Array[]> {
				throw new Error("Function not implemented.")
			},
			write: function (path: string, a: any): Promise<string> {
				throw new Error("Function not implemented.")
			}
		} 
		return r
    }
}
			// read: async (id: string, start: number, end: number) => {
			// 	return this.store.get(id)?.slice(start, end)
			// },
			// write: async(id: string, at: number, a: any) => {
			// 	let st = this.store.get(id)
			// 	if (!st) {
			// 		st = []
			// 		this.store.set(id, st)
			// 	}
			// 	st.push(a)
			// 	console.log('keeper', st)
			// }
interface LocalStateUpdate{
	path: string[],
	length: number,
}
interface LocalStateHostClient {
	update(u: LocalStateUpdate) : void
}
interface KeeperOwner {
	write(id: string, at: number, a: any): Promise<any>
}

class Client {
    constructor(peer: LocalStateHostClient){

	}
}

// use connector to connect to keepers
interface HostConfig {
	keeper: KeeperOwner
}
type LengthListener = (length: number) => void
// there can be multiple keepers, but only one conceptual counter.
class Host implements ConnectablePeer {
	length_ = new Map<string, number>()
    listener = new Map<string, Set<Client>>()
    keeper : KeeperOwner

    constructor(public config: HostConfig) {
        this.keeper = config.keeper
	}

	connect(ch: Channel) : ApiSet {
		// we need to create an api object from the channel
		
		return {
			write: async (id: string, a: any) => {
				const ln = this.length(id) + 1
				await this.keeper.write(id, ln, a)

				// really should wait for quorum
				//Promise.all(pr)
		
				this.length_.set(id, ln)
		
				for (let o of this.listener.get(id) ?? new Set<LengthListener>()) {
					//console.log("sending", o, ln)
					o(ln)
				}
			}
		}		
	}

	disconnect(ch: Channel): void {
		
	}

	length(id: string) {
		return this.length_.get(id) ?? 0
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


function createHostKeeper() {
		// create a keeper/host pair for the fake user state. 
		const keeper = new Keeper()
		const ch1 = new MessageChannel()
		keeper.connect(new WorkerChannel(ch1.port2))


	
		const host = new Host({keeper: KeeperClient})
	
		const chh = new MessageChannel()

}


export function createLocalStateFake(): LocalStateClient {

	 //apiSet<LocalStateClient>(peer, "publish", "subscribe") as LocalStateClient
	
	// const config : LocalStateConfig = {
	// 	cloud: (url: string) => {
	// 	}
	// }
	// const u = new LocalState()


}
