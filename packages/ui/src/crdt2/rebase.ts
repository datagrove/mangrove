
// basic idea is to find an ancestor and diff
// at each lexical step we are going to be doing some whole cloth node replacements, we need to be able to keep the position map  mapNodeidToPos(node,ver) -> pos
// mapPosToNodeid(pos,ver) -> node
// mapPosToPath(pos,ver) -> Lexicalnode?

import { JsonPatch } from "../lexical/sync"

// acceptChanges()

// for lexical we need to access the vector of tokens as a node tree.
// we need to diff if the update is complex enough. only ot patch simple things?

// these are fragile updates, they must be applied at a version in order.
interface OtSplice {
   start: number
   delete: number
   insert: string|any

}
// this must be cautiously rebased. Check the area around the patch and see if we need to do a broader diff.
interface Proposal {
    upd: OtSplice
    before: any[]
    after: any[]
}
// buffers need to both the local and global state. It will keep an editor state for both, when the global state changes we need to rebuild proposals that had already been accepted into the local state tentatively.s
export class OtHtml {
    proposals: Proposal[] = []



    rebase() {
        // we need to check the letters around the patch to see if it still holds.
        // we need to check if the nesting of the the element tags is still valid.
        // we need to potentially reslice marks to fit inside new tags.
    }

    // we need a patch that brings us up to date.
    // we can keep the old editor state and built a patch forward.
    patchFrom(mainVersion: number, proposalVersion: number, upd: OtSplice[]) : [JsonPatch[],number[]]{

        return [[],[]]
    }
}

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