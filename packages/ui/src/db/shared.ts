import { ListenerContext, createSharedListener } from "../worker/shared_listen";

// ugh - https://bugs.chromium.org/p/chromium/issues/detail?id=31666
// no worker from shared worker. no opfs from shared worker.
// the only approach available is to have a leader and let one tab be the leader.

// this module runs as shared worker it's only executed once per session. opening a tab will create a new client state.

// the shared worker keeps track of the leader, if the leader tab closes, another tab must take over the database.

interface ClientState {}
type Ctx = ListenerContext<ClientState>

let leader: Ctx | undefined = undefined
let all = new Set<ClientState>()

const api = {

  // tabs connect to the shared worker, the first tab becomes the leader.
  async connect(context: Ctx, params: any) {
    all.add(context.state)
    if (!leader) {
    
      leader = context
      context.notify("becomeLeader", {})
    }
  },
  // what do we need to do here? reference count?
  // when a tab closes it needs to disonnect from the shared worker.
  async disconnect(context: Ctx, params: any) {
    all.delete(context.state)
    if (leader === context && all.size > 0) {
      leader = all.values().next().value
      leader?.notify("becomeLeader", {})
    }
  },

  // everything else is simply forwarded to the leader.
  async unknown(context: Ctx, params: any) {
    leader?.post(params)
  }
}

// a shared listener listens to api calls.
createSharedListener(api, {} as ClientState)









