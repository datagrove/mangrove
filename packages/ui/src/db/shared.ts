
import { create } from "sortablejs";
import { ListenerContext, ServiceFn, createSharedListener } from "./shared_util";
import { Listener } from "lexical/LexicalEditor";
// @ts-ignore

// this is like main for the shared worker, it's only executed once per session. opening a tab will create a new client state.
interface ClientState {

}
type Ctx = ListenerContext<ClientState>

// these can be optimistic, and allow the reader to pull what they need directly from the shared buffer, or we can copy directly into a temporary buffer that is charged to the transaction.


const api = {
  async connect(context: Ctx, params: any) {
  },

}

const init = (ctx: Ctx) => ctx.log("db started")
createSharedListener(api, {} as ClientState, init)



