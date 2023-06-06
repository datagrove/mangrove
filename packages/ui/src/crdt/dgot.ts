

// not truly ot or a crdt. one step, like prosemirror. ranges are added, but can be deleted if found to contradict
// we need to build an editor or ?

export type Changefn = (e: HtmlDiff) => HtmlDiff

// when you format <b>text</b> in lexical you must create a new text node.
export type HtmlDiff = {
    insertNode: {
        parent?: string
        after?: string
        tag?: string  // a
        text?: string 
        attr?: object
    }
    deleteNode: string[]
}

type TextNode = string
type ElementNode = {
    [key: string]: string
}
type Onode = TextNode | ElementNode
interface OtDoc {
    version: number
    data: Onode[]
}

// may not overlap, and positions refer to index at beginning of step.
interface OtopInsert {
    o: 0   
    i: string
    p: number
}
interface OtopFormat {
    o: 2
    a: any
    p: [number, number]
}
interface OtopDelete {
    o: 1
    d: [number, number][]
}

interface OpArray {
    o: (OtopInsert | OtopDelete | OtopFormat)[]
    v: number
}

function rebase(op: OpArray) : OtDoc|undefined {

     return undefined
}

export interface  Tuple {
    stable: OtDoc
    proposed: OtDoc
    editorDoc: any
    editorVersion: number
}
/*
// because this is async other editor changes can happen and could call this function again before it completes
// maybe settimeout when this happens? can we set into an array, process as a batch?
// export async function onChange(t: Tuple, e: EditorState){
//     // we need to figure out a diff that advances the editor state to the next one
//     const oa = getChanges(t.editorDoc,e)
//     // then we apply the changes to our tuple to create a new proposed tuple.
//     // we also attempt to propose these to the db
//     let [ok, fix] = await propose(1, oa)
//     while (!ok) {
//         // rebase the steps. Deactivate node insertions that conflict. We could use other rules 
//         [ok, fix] = await propose(1, oa)
//     }
// }
export  function applyOp(t: OtDoc, a: OpArray ) {
    return t
}
type EditorState = any


export async function onServerChange(t: Tuple, a: OpArray, e: Editor) {
    t.stable = applyOp(t.stable,a)


    
}
export async function propose(version: number, op: OpArray) : Promise<[boolean, OpArray|undefined]> {
    return [true, undefined]
}



// we also need a pinned tuple and an attribute to edit.


// editors are mostly going to operate by node ids. when we give it html, we should give it ids
// when we give it changes we should give it ids.
type LexicalState = {}
export function lexicalAdaptor(onChange: (o: HtmlDiff)=>HtmlDiff ) : Editor  {
    let st: EditorState = {}

    const ch= (state: EditorState)=> {
        const getChanges = (old: EditorState, next: EditorState) : OpArray =>{
            return {
                o: [],
                v: 0
            }
        }
        // first get changes
        const oa = getChanges(t.editorDoc,state)
        oa.v = t.editorVersion+1
        // 
    }
    
    return {
       signalChange: ()=>{
            // state.update(()=>{})
       }
    }
}
*/

