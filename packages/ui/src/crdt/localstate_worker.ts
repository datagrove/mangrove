import { ApiSet, ConnectablePeer, Peer, Rpc, WorkerChannel, WsChannel } from "../abc/rpc";
import { createSharedListener } from "../abc/shared";
import { LocalState } from "./localstate";


let ctx: any = self as any

const status = (x: string)=> {
    console.log("status",x)
}
// this is hard because we are a shared worker, and not allowed to start a worker
// so the database port must be passed with an api, and it must be transferred.
// maybe try to transfer everything?
// maybe there should be initialization baked in?
const ls = new LocalState({})
createSharedListener(ls)