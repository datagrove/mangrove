import { ConnectablePeer, Cloud } from "./cloud"


// use connector to connect to keepers
interface HostConfig {
    cloud: Cloud
    keepers: string[]
}

// there can be multiple keepers, but only one conceptual counter.
class Host implements ConnectablePeer {
	length_ = new Map<string, number>()
    listener = new Map<string, Set<EditorClient>>()
    keeper : KeeperOwner

    // unclear why we need this?
    connected = new Set<Peer>()


    constructor(public config: HostConfig) {
        this.keeper = config.keepers.map((k) => config.cloud.connect(k) as KeeperOwner)
	}

	length(id: string) {
		return this.length_.get(id) ?? 0
	}

    connect(ch: Channel)
        
    }
    disconnect(ch: Channel: void {
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






