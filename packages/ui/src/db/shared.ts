import { ListenerContext, createSharedListener } from "../worker/shared_listen";
import { createWorker } from "../worker/useworker";

// ugh - https://bugs.chromium.org/p/chromium/issues/detail?id=31666
// no worker from shared worker. no opfs from shared worker.
// the only approach available is to have a leader and let one tab be the leader.

// this module runs as shared worker it's only executed once per session. opening a tab will create a new client state.

// the shared worker keeps track of the leader, if the leader tab closes, another tab must take over the database.

interface ClientState {

}
type Ctx = ListenerContext<ClientState>

let leader: Ctx | undefined = undefined

let all = new Set<ClientState>()

const api = {
  async connect(context: Ctx, params: any) {
    all.add(context.state)
    if (!leader) {
      leader = context
      context.notify("becomeLeader", {})
    }
  },
  // what do we need to do here? reference count?
  async disconnect(context: Ctx, params: any) {
    all.delete(context.state)
    if (leader === context && all.size > 0) {
      leader = all.values().next().value
      leader?.notify("becomeLeader", {})
    }
  },
  async forward(context: Ctx, params: any) {
    leader?.post(params)
  }
}


createSharedListener(api, {} as ClientState)









