import { Rpc } from "./socket";


const ctx = self as any;

import {api} from './apix'

function addPort(port: MessagePort) {

} 




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

    addPort(port)
  };