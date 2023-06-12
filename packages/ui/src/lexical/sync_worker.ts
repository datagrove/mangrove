import { RootNode } from "lexical"
import { BufferApi, JsonPatch, PositionMapPatch } from "./sync_shared"

// what are the limitations of using json patch? quill delta? prosemirror steps? diff patch? git delta even?
// rfc patch doesn't diff strings, which seems limiting. peritext?

// chunks should be fine.
// op, type, content, mark

interface ValueRef {
    site: number,   // this is a local id that allows us to look up the server and its site id.
    table: string,
    key: string,
}
export function valueUrl(v: ValueRef) {
    return `/api/${v.site}/${v.table}/${v.key}`
}
export function parseUrl(url: string): ValueRef {
    let [_, site, table, key] = url.split("/")
    return { site: parseInt(site), table, key }
}

type Attr = undefined|(string|string[])[]
enum Op {
    insertString = 0,
    retain = 1,
    delete = 2,
    insertObject = 3,
    insertInlineObject = 4,
    insertBreak = 5
}
type Chunk = [string, Attr ] | [1, number,Attr ] | [2, number] | [3|4, string, any] | [5, Attr]
type QuillDoc = Chunk[]
type QuillDelta = Chunk[]

function squash(q: QuillDelta[]) : QuillDelta {
    return q[0]
}

// provide log(n) operations
class QuillTree  {
    apply(p: QuillDelta) {

    }
}


interface Text {
    type: "text"
    content: string
    mark: string[][]
}


// convert to interval tree? or maybe create minimal span set?

// 1. Get the positional selection in the old edit state
// 2. Transform the selection into the new edit state 
// 3. Transform the selection back into the old state (this is not #2, delete is not commutative)
// 4. Get the anchored selection in the the old edit state 
// 5. Apply the anchored selection to the new edit state

// problem: how do we map into different node sets?
// here we can't just limit to the top node, all nodes will have an id.


// maybe here in the worker we should only work with positions
// we can't just push patches from one buffer to another then? it will lose the ids.

// selections are trouble. The anchors are easy to delete.
// 1. we could treat selection change as a change, but this will create a lot of extra work?
// 2. we could provide an api that allows us to query te selection.


interface BufferListener {
   update (p:JsonPatch[]|string, version: number, pos: PositionMapPatch):void 
   getSelection(): Promise<[number,number]>
}

// future prosemirror, etc support
interface EditorBuffer extends BufferApi {

}


class LexicalBufferState implements EditorBuffer{
    current : Element[] = []
    prev: Element[] = []
    version = 0

    constructor(public bs: ValueManager,public bw: BufferWorker, public api: BufferListener){

    }
    async setPath(path: string) {
        // we need to change to a new buffer set.
        this.bs.buffer.delete(this)
        if (path) {
             let bs = this.bw.get(path)
             this.api.update(JSON.stringify(bs.globalDoc), 0, [])
        }
    }

    merge(old: any, now: any, target: any) {

    }
    // not really a json patch, more of a paragraph list.
    async propose(p: JsonPatch[], version: number) {
        this.version = version
        //this.bs.applyProposalPatch(this, p)
        // update our own list. 

        let dirty : number[] = []
        this.prev = [...this.current]
        for (let o of p){

        }

        // 3-way merge: old buffer state, new buffer state, old buffer set proposal -> new buffer set proposal


        // request the selection from each buffer and transform it into the a new selection using offsets. We'll send the offsets back, the editor will first need to assign ids to the nodes, then it can recover the selection from the position.


    


        // as long as we only have local editors we could simply broadcast this patch to the others in the buffer set. If we have a global document or other editors, then we need to create a finer grained patch.
    }
    
}

interface GlobalApi {

    // provide the length you last saw a {key} write, and the bytes you want write. returns the length of the site if you are behind or 0 if the write is accepted.
    commit(site: number,  
        key: Uint8Array, 
        at: number, 
        data: Uint8Array) :  Promise<number>
    // acknowledge reading the sync log.
    trim(device: number, length: number) : Promise<void>
}
interface GlobalListener {
    sync(length: number) : Promise<void>
}


class ValueManager {
    constructor(public bw: BufferWorker, public ref: string){

    }

    // global doc will need to be some type that works with multiple editors, lexical for now.
    globalDoc = new QuillTree()
    proposalDoc = new QuillTree()
    // squash as we go? we might need to read a list from the database?
    proposalDelta: QuillDelta[] = []
    version = 0
    buffer = new Map<any, EditorBuffer>()



    applyGlobalPatch(p: QuillDelta) {
        // apply the patch to the global doc
        // we'll wait 
        this.globalDoc.apply(p)
    }
    applyProposalPatch(b: EditorBuffer, p: JsonPatch[]) {
        // 
    }
}

export const editors : {
    [key: string]: ( bs: ValueManager, bw: BufferWorker, api: BufferListener) => EditorBuffer
} =  {
    lexical: ( bs: ValueManager, bw: BufferWorker, api: BufferListener) => new LexicalBufferState(bs,bw,api)
}

// we need a network manager that alerts us to global api's going up and down.
// we need a storage manager that keeps our local data 
class BufferWorker {
    path = new Map<string, ValueManager>()
    buffer = new Map<MessagePort, BufferApi>()
    server =  new Map<string, GlobalApi>()


    // sort the keys and split them by server, we can try to sync in parallel
    async attemptPush(key: string[]){
        // in general we can be ahead and behind here, we need to do a merge before a push (but we merge as we read)
        // we also want to rate limit our writing, batching changes, so probably call this from a timer. we would like to tweak the counter if we are actively collaborating
        for (let k of key){
            let api: GlobalApi
            // squash any outstanding commits
            let v : ValueManager 
            v.proposalDelta = [squash(v.proposalDelta)]

            const r = parseUrl(key)

            const need = api.commit(0, key, 0, v.proposalDelta[0].toBytes())
        }

    }

    openBuffer(path: string, editor: string, mp: MessagePort): BufferApi {
        let bs = this.path.get(path)
        if (!bs) {
            bs = new ValueManager(this,path)
            this.path.set(path, bs)
        }
        const ed = editors[editor]

        let api: BufferListener = {
            update: function (p: string | JsonPatch[], version: number, pos: PositionMapPatch): void {
                throw new Error("Function not implemented.")
            },
            getSelection: function (): Promise<[number, number]> {
                throw new Error("Function not implemented.")
            }
        }
        let state = ed(bs, this, api)

        bs.buffer.set(mp, state)
        return state
    }
    closeBuffer(mp: MessagePort){
        const bst = this.buffer.get(mp)
        if (!bst) return
        bst.setPath("")
        this.buffer.delete(mp)
    }

    get(path: string): ValueManager {
        return new ValueManager()
    }

}