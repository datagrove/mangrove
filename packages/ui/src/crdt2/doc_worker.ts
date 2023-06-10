import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel, Service, WorkerChannel, apiSet } from "../abc/rpc"
import { JsonPatch } from "../lexical/sync"
import { DocApi, EditorSelection, ListenerApi, Op } from "./data"


type TagTree = {

}
type DeleteTree = {
}



// there will be a buffer for each editor.
// it could have its own worker for integrating changes and making suggestions.
// each buffer maintains a doc, the local state has one. global state is just encrypted log and version
type DocState = {
    version: number
    length: number
    tag: TagTree
    delete: DeleteTree
    text: string
}

// Document is going to live in a worker; it will take ops from the server and json patches from the editor.

// tabstate should be the doc client.


// we need a way for the document worker to send updates to the tabstate
// so the tabstate can alert the buffers.
// there's no great way a shared work to manage workers of its own. we could try using a leader, for now just duplicate the work


// we can use the listener api to send updates to tabstate from the Doc worker
// maybe should give the document a message port to the localstate?
// potentially give it a message port to each buffer?
export class Doc implements DocApi {
    key: string = ""
    proposal: Op[] = []
    nextProposal: Op[] = []
    global?: DocState
    buffer = new Map<number,DocState>()

    // these can't fail or be invalid.
    async globalUpdate(op: Op[], version: number) {
        for (let o of op) {
            switch(o.type) {
                case "insert":
                    break;
                case "tag":
                    break;
                case "remove":
                    break;
            }
        }
    }

    // turn the patches into ops, and then mergeup
    // this gets call on either localstate changes or editor changes
    // these don't fail, but we need to be able invalidate tags and then patch the document to reflect that.
    
    async update(buffer: number, op: JsonPatch[], sel: EditorSelection): Promise<void> {
        let doc = this.buffer.get(buffer)
        if (!doc) {
            doc = {
                version: 0,
                length: 0,
                tag: {},
                delete: {},
                text: "",
            }
            this.buffer.set(buffer, doc)
        }


        return
    }

}
