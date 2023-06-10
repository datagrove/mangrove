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
    positionMap = new RebaseMap()
    dirty = new Set<string>() // all the dgid's that have changed.
}
class Node {
    children: Node[] = []
}
class Rope {


    // just adjusts the tag location 
    insertText(text: string, pos: number, length: number) {
        // tags are added in the sparse domain
    }
    // inserting a tag can cause other tags to be invalidated
    insertTag(tag: object, pos: number, length: number): number[] {
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

// each object that we start tracking needs a unique id shared among all the buffers.
// we can send this in patches, starting with the first. when the editor introduces a new object we need to create a new id.


// we need to track the state of the buffer so we can send it accurate patches.
// each buffer will have a different selection and could have different versions of the document 
// maybe this is just a set of dirty nodes that we clean when the patch is accepted? we can't expect that the node ids are even related. so maybe the idea  of a buffer is just whack.
class Buffer {
    // note that the strings here are node ids that are only meaningful to this single buffer. creating our own editor would require these to be unique, but they could be unique by -sessionid saving time and space
    dirtyGid = new Set<string>() // all the dgid's that have changed since last reconcilliation.
    mapGid = new Map<string, string>() // map gid to node id
    dirty = new Set<string>()
    current = new Map<string, object>() // editor's view of the document.

    // to start the position map is empty, each time we accumulate some changes we need to update it, then clear it when we reconcile.
    position = new RebaseMap()
    // we need to be able to build an accurate position map based on the last reconciled version in order to transform the selection. maybe this should be a vector? or a tree root? we nee

    // this updates the editor's current view of the document
    async updateCurrent(op: JsonPatch[]): Promise<void> {
        // if there is a proposal, we can just merge the patch into nextProposal
        // if there is no proposal then convert it to ops and propose it.
        // try to update the 
        for (let o of op) {
            this.dirty.add(o.path)
            switch (o.op) {
                case "add":
                    this.current.set(o.path, o.value)
                    break;
                case "remove":
                    this.current.delete(o.path)
                    break;
                case "replace":
                    this.current.set(o.path, o.value)
            }
        }
        return
    }

    // the editor calls this when it has no changes of its own, but it wants to accept server changes. it gets a signal each time there are server changes, then it needs to call this to accept them.
    async getChanges(doc: Doc, sel: EditorSelection): Promise<[JsonPatch[], EditorSelection]> {
        // does lexical let us create our own node id? do we need it?
        // when one buffer adds a node, we can assign it a dgid and add it to all the buffers.
        // here we are mostly interested in nodes that have changed in the document.
        // in the normal case, there is nothing changed here at all? should we even signal then?

        let changes: JsonPatch[] = []
        for (let dgid of this.dirtyGid) {
            let node = doc.getNode(dgid)
            changes.push({
                op: node?"replace":"remove",
                path: this.mapGid.get(dgid)??"", // what happens when the node doesn't have an id? can we just make one?
                value: node
            })
        }

        this.dirty.clear()
        this.dirtyGid.clear()
        this.position = new RebaseMap()
        sel.begin = this.position.mapin(sel.begin)
        sel.end = this.position.mapin(sel.end)
        return [changes, sel]
    }
}

// we can use the listener api to send updates to tabstate from the Doc worker
// maybe should give the document a message port to the localstate?
// potentially give it a message port to each buffer?
export class Doc implements DocApi {
    buffer = new Map<number, Buffer>()
    sessionId: number = Math.random()
    tabstate?: ListenerApi
    ls!: LocalStateApi
    key: string = ""
    proposal?: Op[]
    nextProposal: Op[] = []
    global?: DocState

    rope = new Rope()
    version = 0

    getNode(dgid: string) : Node {
        return new Node()
    }

    async update(buffer: number, op: JsonPatch[], sel: EditorSelection): Promise<void> {
        let b = this.buffer.get(buffer)
        if (!b) {
            b = new Buffer()
            this.buffer.set(buffer, b)
        }
        b.updateCurrent(op)
        if (!this.proposal) {
            this.buildProposal()
        }
    }

    // the main rule for lexical is that element nodes can't go inside text or decorator nodes.
    // decorators can't have length, so there is no inside.
    // style nodes can be split arbitrarily so that they fit inside the elements so this is the main thing we need to adjust. we need to delete the old style nodes and create new ones.

    // these can't fail or be invalid, we can invalidate later if they conflict with a local tag (lww)
    // maybe two apis, one for success, one for failure?
    // each buffer has a different sessionId? is it practical to combine them?
    // maybe the buffer number is the sessionId?
    // maybe if there is a proposal and its not accepted, we don't want to notify any

    // the strategy is to not to notify any buffers until all the changes are integrated. this makes easy to swap nodes.
    async globalUpdate(op: Op[], sessionId: number, version: number) {
        // note all the nodes that are changed by this update
        let dirty = new Set<string>()
        let rm = new RebaseMap() 
        // update our model. nothing here should fail because these changes have already been vetted by the server and the version lock. They may cause our rebase to require changes, especially to leaf nodes. It's not clear how to best change the leaf nodes into ops in the first place?
        for (let o of op) {
            switch (o.type) {
                case "insert":
                    // we can insert text into the rope, how do we find the node that it replaces in lexical? what if each text node is given a start position and we can transform it?
                    break;
                case "tag":
                    // this is two insertions in our model, but replaces the entire node in lexical's model. in our model it requires slicing all proposed text ranges.
                    this.rope.insertTag(o.attr, o.start, o.end)
                    break;
                case "remove":
                    this.rope.remove(o.start, o.end)
                    break;
            }
        }

        // If there are any conflicts, then we will generate a new proposal which will delay notification of the buffers. Only notify the buffers when there is no proposal.

        // every buffer that's not sessionId now needs to be notified of the change
        // they will ignore the change if they have outstanding changes that the version doesn't include
        // we can send one message to the tabstate and it can signal each buffer.
        // we can prepare each buffer by adding the changes
        for (let b of this.buffer.values()) {

        }
        this.tabstate?.update(this.key, this.version, this.version)
        this.buildProposal()

        // why not use length in bytes or ops as the version instead of tracking both?
        this.version = version

    }

    async buildProposal(rebase?: boolean) {
        this.proposal = this.nextProposal
        if (this.proposal.length > 0) {
            this.nextProposal = []
            // send the proposal to the server
            this.ls.propose(this.key, this.proposal, this.version, this.sessionId)
        }
        // if (sessionId != this.sessionId) {
        //     // proposal failed. we need to rebase the proposal
        //     this.buildProposal()
        // } else {
        //     // our proposal was accepted, we need to build a new proposal if there is one.
        //     this.proposal = undefined
        //     if (this.dirty.size > 0) {
        //         this.buildProposal()
        //     }
        // }
        // two kinds of dirty? not right with editor, not in a proposal?
        
    }
    // turn the patches into ops, and then mergeup
    // this gets call on either localstate changes or editor changes
    // these don't fail, but we need to be able invalidate tags and then patch the document to reflect that.



}
