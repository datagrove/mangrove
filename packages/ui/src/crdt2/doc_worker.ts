import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel, Service, WorkerChannel, apiSet } from "../abc/rpc"
import { JsonPatch } from "../lexical/sync"
import { DocApi, EditorSelection, ListenerApi, LocalStateApi, Op } from "./data"

// as we operate on the document we need to know how to remap the positions in ch
class RebaseMap {
    add(pos: number, length: number) {
        // deletions are added in the dense domain.
    }
    mapin(pos: number): number {
        return pos
    }
    mapout(pos: number): number {
        return pos
    }
}
class Context {
    PositionMap = new RebaseMap()
}
class Rope {

    // just adjusts the tag location 
    insertText(text: string,pos: number, length: number) {
        // tags are added in the sparse domain
    }
    // inserting a tag can cause other tags to be invalidated
    insertTag(tag: object, pos: number, length: number) : number[] {
        // tags are added in the sparse domain
        return []
    }
    remove(pos: number, length: number) {
        // remove a start or end tag causes the other to be invalidated
    }
}
// use to find tags to invalidate, mostly we care about nesting: starts and stops
// the tree is a sparse tree in the sparse domain, we don't delete, only invalidate.
class TagTree {

    // just adjusts the tag location 
    insertText(pos: number, length: number) {
        // tags are added in the sparse domain
    }
    insertTag(tag: object, pos: number, length: number) {
        // tags are added in the sparse domain
    }
 
}




// there will be a buffer for each editor.
// it could have its own worker for integrating changes and making suggestions.
// each buffer maintains a doc, the local state has one. global state is just encrypted log and version
type DocState = {
    version: number
    length: number
    rope: Rope
    rebase: RebaseMap
}

// Document is going to live in a worker; it will take ops from the server and json patches from the editor.

// tabstate should be the doc client.


// we need a way for the document worker to send updates to the tabstate
// so the tabstate can alert the buffers.
// there's no great way a shared work to manage workers of its own. we could try using a leader, for now just duplicate the work

class Buffer {
    // we need to track the state of the buffer so we can send it accurate patches.
    // each buffer will have a different selection and could have different versions of the document 
    // maybe this is just a set of dirty nodes that we clean when the patch is accepted?
    dirty = new Set<string>()
}
// we can use the listener api to send updates to tabstate from the Doc worker
// maybe should give the document a message port to the localstate?
// potentially give it a message port to each buffer?
export class Doc implements DocApi {
    sessionId: number = Math.random()
    ls!: LocalStateApi
    key: string = ""
    proposal?: Op[]
    nextProposal: Op[] = []
    global?: DocState
    buffer = new Map<number,Buffer>()
    rope = new Rope()
    version = 0
    copy = new Map<string, object>() // editor's view of the document.
    dirty = new Set<string>()
    old = new Map<string, object>() // editor's view of the document.

    // the main rule for lexical is that element nodes can't go inside text or decorator nodes.
    // decorators can't have length, so there is no inside.
    // style nodes can be split arbitrarily so that they fit inside the elements

    // these can't fail or be invalid, we can invalidate later if they conflict with a local tag (lww)
    // maybe two apis, one for success, one for failure?
    async globalUpdate(op: Op[], sessionId: number,  version: number) {
        for (let o of op) {
            switch(o.type) {
                case "insert":
                    break;
                case "tag":
                    this.rope.insertTag(o.attr, o.start, o.end)
                    break;
                case "remove":
                    this.rope.remove(o.start, o.end)
                    break;
            }
        }

        // why not use length in bytes or ops as the version instead of tracking both?
        this.version = version
        if (sessionId != this.sessionId) {
            // proposal failed. we need to rebase the proposal
            this.sendProposal()
        } else {
            // our proposal was accepted, we need to build a new proposal if there is one.
            this.proposal = undefined
            if (this.dirty.size > 0) {
                this.sendProposal()
            }
        }
    }
 
    async sendProposal(rebase?: boolean) {
        this.proposal = this.nextProposal
        if (this.proposal.length > 0) {
            this.nextProposal = []
            // send the proposal to the server
            this.ls.propose(this.key,this.proposal, this.version, this.sessionId)
        }

        // two kinds of dirty? not right with editor, not in a proposal?
        this.dirty.clear()
    }
    // turn the patches into ops, and then mergeup
    // this gets call on either localstate changes or editor changes
    // these don't fail, but we need to be able invalidate tags and then patch the document to reflect that.
    
    async update(buffer: number, op: JsonPatch[], sel: EditorSelection): Promise<void> {
        // if there is a proposal, we can just merge the patch into nextProposal
        // if there is no proposal then convert it to ops and propose it.
        // try to update the 
        for (let o of op) {
            this.dirty.add(o.path)
            switch(o.op) {
                case "add":
                    this.copy.set(o.path, o.value)
                    break;
                case "remove":
                    this.copy.delete(o.path)
                    break;
                case "replace":
                    this.copy.set(o.path, o.value)
            }
        }
        if (!this.proposal){
            this.sendProposal()
        }

        return
    }

}
