import { Service, Watch } from "./data";
import { Store, Write, Read, PageRef } from "./ptree";
import { Rpc } from "./socket";

const st = new Store("db")
const ctx = self as any;
export const api = new Service

// these can be optimistic, and allow the reader to pull what they need directly from the shared buffer, or we can copy directly into a temporary buffer that is charged to the transaction.
export function dbapi(s: Service) {
  s.set('connect', async (params: any): Promise<number> => {
    return 0
  })
  s.set('begin', async (params: any): Promise<number> => st.begin())
  s.set('updateTx', async (params: Write): Promise<void> => {
    st.tx.get(params.tx)?.update(params)
  })

  s.set('readTx', async (params: Read): Promise<PageRef[]> => {
    return st.tx.get(params.tx)?.read(params) ?? []
  })


  s.set('commitTx', async (params: number): Promise<void> => {
    st.tx.get(params)?.commit()
  })

  // subscriptions act like an advisory lock; if the range has been updated then we send a notification

  s.set('watch', async (params: Watch): Promise<number> => {
    st.watch.set(++st.nextWatch, params)
    // more to do - contact server etc
    return st.nextWatch
  })
  s.set('unwatch', async (params: number): Promise<void> => {
    st.watch.delete(params)
  })
}
dbapi(api)


ctx.onconnect = (e: any) => {
  const port = e.ports[0];

  port.addEventListener("message", (e: any) => {
    //const workerResult = `Result: ${e.data[0] * e.data[1]}`;
    const rpc = e.data as {
      method: string
      id: number
      params: any
    }
    const o = api.get(rpc.method)
    if (o) {
      o(rpc.params).then((r: any) => {
        port.postMessage({
          id: rpc.id,
          result: r
        })
      }).catch((e: any) => {
        port.postMessage({
          id: rpc.id,
          error: e
        })
      })
    } else {
      port.postMessage({ id: rpc.id, error: `no method ${rpc.method}` })
    }
  })

  port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.

  //addPort(port)
};