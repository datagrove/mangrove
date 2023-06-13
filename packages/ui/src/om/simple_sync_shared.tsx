import { Op } from "./om"


// shared state.
export interface ServiceApi {
    update(ops: Op[]): void

}

// receive updates to a sequence
export interface LensApi {
    update(ops: Op[]): void
}
