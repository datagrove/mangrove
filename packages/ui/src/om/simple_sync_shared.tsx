import { Op } from "./om"


// shared state.

// we have to do something unusual to send a MessagePort?
export interface ServiceApi {
    connect(ch: MessagePort, ): void
}

// receive updates to a sequence
export interface LensApi {
    update(ops: Op[]): void
}
