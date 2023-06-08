import { KeeperClient, LocalStateClient, apiSet, HostClient, Stat, LocalStateFromHost, LocalStateFromHostApi, Err } from "./localstate_shared"
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
interface LocalStateUpdate {
	path: string[],
	length: number,
}


class Client {

	open = new Map<string, number>()
	local: LocalStateFromHost
	constructor(ch: Channel, public  cid: number) {
		this.local = LocalStateFromHostApi(ch)
	}
}

// sites grow slowly, probably not worth writing r2 repeatedly
// but we could write to a keeper service - does this help or hurt resiliency?
class Site {
	sub = new Set<Client>()
	length = 0
}

// use connector to connect to keepers
interface HostConfig {
	keeper: KeeperClient
}
type LengthListener = (length: number) => void
// there can be multiple keepers, but only one conceptual counter.
class Host implements ConnectablePeer {
	site_ = new Map<number, Site>()
	client_ = new Map<Channel, Client>()
	path_ = new Map<string, number>()
	cid = 42
	inode = 42

	keeper: KeeperClient

	constructor(public config: HostConfig) {
		this.keeper = config.keeper
	}


	connect(ch: Channel): ApiSet {
		// we need to create an api object from the channel
		const cid = this.cid++
		this.client_.set(ch, new Client(ch,this.cid++))
		const me = this
		const r: HostClient = {
			publish: async function (site: number[], length: number[]): Promise<Err | undefined> {
				for (let i = 0; i < site.length; i++) {
					let s = me.site_.get(site[i])
					if (!s) {
						s = new Site()
						me.site_.set(site[i], s)
					}
					const buf = new Uint32Array([cid, length[i]])
					s.length += 8
					await me.keeper.write(site[i], buf)
				}
				return
			},
			authorize: async function (site: number, length: number): Promise<string | string[]> {
				return [""] // accepted by our test keeper.
			},
			create: async function (path: string): Promise<string | number> {
				return me.inode++
			}
		}
		return r
	}

	disconnect(ch: Channel): void {
		this.client_.delete(ch)
	}
}


function createHostKeeper() {
	// create a keeper/host pair for the fake user state. 
	const keeper = new Keeper()
	const ch1 = new MessageChannel()
	keeper.connect(new WorkerChannel(ch1.port2))



	const host = new Host({ keeper: KeeperClient })

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
