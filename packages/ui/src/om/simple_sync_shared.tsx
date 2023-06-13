import { Channel, apiCall } from "../abc/rpc"
import { Op } from "./om"


// shared state.

// we have to do something unusual to send a MessagePort?
export interface ServiceApi {
    connect(ch: MessagePort,key: string ): void
}

// receive updates to a sequence
export interface LensApi {
    update(ops: Op<any>[]): void
}
export function lensApi(ch: Channel): LensApi {
    return apiCall(ch, "update")
}
