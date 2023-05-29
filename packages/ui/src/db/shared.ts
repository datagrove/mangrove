import { ListenerContext, createSharedListener } from "../worker/shared_listen";


// this module runs as shared worker it's only executed once per session. opening a tab will create a new client state.
interface ClientState {

}
type Ctx = ListenerContext<ClientState>

// these can be optimistic, and allow the reader to pull what they need directly from the shared buffer, or we can copy directly into a temporary buffer that is charged to the transaction.


const api = {
  async connect(context: Ctx, params: any) {
  },
  // what do we need to do here? reference count?
  async disconnect(context: Ctx, params: any) {

  }
}

const init = (context: Ctx) => {
  context.log("shared started")
}
createSharedListener(api, {} as ClientState, init)








