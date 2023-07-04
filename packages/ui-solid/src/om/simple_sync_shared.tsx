import { Channel, apiCall } from "../../../abc/src/rpc"
import { OmStateJson, Op } from "./om"


// shared state.

// we have to do something unusual to send a MessagePort?
export interface ServiceApi {
    connect(ch: MessagePort,key: string ): Promise<OmStateJson>
}
export function serviceApi(ch: Channel): ServiceApi {
    return apiCall(ch, "connect")
}

// receive updates to a sequence
export interface LensApi {
    update(ops: Op[]): void
    close(): void
}
export function lensApi(ch: Channel): LensApi {
    return apiCall(ch, "update")
}

