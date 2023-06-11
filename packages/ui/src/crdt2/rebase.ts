
// basic idea is to find an ancestor and diff
// at each lexical step we are going to be doing some whole cloth node replacements, we need to be able to keep the position map  mapNodeidToPos(node,ver) -> pos
// mapPosToNodeid(pos,ver) -> node
// mapPosToPath(pos,ver) -> Lexicalnode?

import { JsonPatch } from "../lexical/sync"

// acceptChanges()

// for lexical we need to access the vector of tokens as a node tree.

interface OtUpdate {

}
class OtHtml {
    patchFrom(version: number) : JsonPatch[] {
        return []
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