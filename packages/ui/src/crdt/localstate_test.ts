import { LocalState, LocalStateConfig } from "./localstate"
import { KeeperClient, LocalStateClient,  HostClient, Stat, LocalStateFromHost, LocalStateFromHostApi, Err, KeeperClientApi, LocalStateClientApi, HostClientApi } from "./localstate_shared"
import { ApiSet, Service, Peer, WorkerChannel } from "../abc/rpc"
import { Channel } from "../abc/rpc"
import { DbLiteClientApi } from "../dblite/api"
import { DbLite } from "../dblite/dblite"
import { editor_schema } from "./editor_schema"


// These are for testing. deploy the go version

// the only way this works is with the everything in one tab test version
// the localstate_worker doesn't know how to use them.
// this produces a new LocalState for each call, but it won't be in a shared worker


// clouds do not share sites, each client must connect to the correct host 
export class Keeper implements Service {
	store = new Map<number, Uint32Array>()
	constructor(config?: any) {
	}

	disconnect(ch: Channel): void {

	}
	connect(ch: Channel) {
		
		// connectionless
		const r: KeeperClient = {
			read:  async (site: number, start: number, end: number): Promise<string | Uint32Array> => {
				const s= this.store.get(site)
				if (!s) return "no site"
				return s.slice(start,end)
			},
			write: async (site: number, at: number, a: Uint32Array): Promise<string|undefined> => {
				const s= this.store.get(site)
				if (!s) return "no site"
				this.store.set(site, new Uint32Array([...s,...a]))		
			},
			append: function (site: number, at: number, a: Uint32Array): Promise<string> {
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
class Host implements Service {
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
					await me.keeper.write(site[i],s.length, buf)
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


function createHostKeeper()  : [HostClient, KeeperClient]{
	// create a keeper/host pair for the fake user state. 
	const keeper = new Keeper()
	const ch1 = new MessageChannel()
	keeper.connect(new WorkerChannel(ch1.port2))
	let api = KeeperClientApi(new WorkerChannel(ch1.port1))
	const config : HostConfig = { 
		keeper: api 
	}

	const ch2 = new MessageChannel()
	const host = new Host(config)
	host.connect(new WorkerChannel(ch2.port2))
	let api2 = HostClientApi(new WorkerChannel(ch2.port1))

	const ch3 = new MessageChannel()
	keeper.connect(new WorkerChannel(ch2.port2))
	let api3 = KeeperClientApi(new WorkerChannel(ch2.port1))

	return [api2,api3]

}


export function createLocalStateFake(): LocalStateClient {

	let [host,keeper] = createHostKeeper()

	const m2 = new MessageChannel()
	const api = DbLiteClientApi(new WorkerChannel(m2.port1))

	const svr = new DbLite(editor_schema)
	svr.connect(new WorkerChannel(m2.port2))
	
	const c : LocalStateConfig = {
		host: host,
		keeper: keeper,
		db: api
	}
	const u = new LocalState(c)

	const m = new MessageChannel()
	u.connect(new WorkerChannel(m.port2))
	//apiSet<LocalStateClient>(peer, "publish", "subscribe") as LocalStateClient

	// const config : LocalStateConfig = {
	// 	cloud: (url: string) => {
	// 	}
	// }
	// const u = new LocalState()

	return LocalStateClientApi(new WorkerChannel(m.port1))
}
