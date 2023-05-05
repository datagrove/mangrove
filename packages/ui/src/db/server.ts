// steps parameterized by 

import { Sequencer } from "./sequencer"

// accepts steps in order, or rejects them.
// Each committer can create a eqivalent snapshot stream
// use lock interface here?

export interface Nodex {
    keys: Uint8Array[]
    children?: Nodex[]
    leaf?: Uint8Array[]
}

// snapshot is a  counted btree.
export interface Snapshot {
    root: Nodex
    gsn: number
    lsn: number
}

// functor based? each cell is a log of op/value
export interface Tx {
    lock: { [key: string]: number }  // locks must advance by 1 or tx fails
    key: Uint8Array[]
    value: Uint8Array[]
    op: string[]
}

export class Dbms {
    seq: { [key: string]: Sequencer } = {}

    // locally we have a btree with partial images of multiple servers
    // we need normal counted btree operations
    // cell based (allow columns)
    

    // why wait?
    async commit(tx: Tx): Promise<void> {

    }
}

export interface Pos {

}
export interface Committer {
    screenName: string
    cursor: Pos[]
    selection: [Pos,Pos][]
}
type LWW = {
    value: string
    gsn: number
}


// each cell has a state we can listen to by creating an editor on it.
// there is a value type, a step type T, and a committer type Cl
// cl is mostly a cursor position, but could be a selection range.
export interface CellState<T=LWW, V=string, Cl=Committer> {
    value: V
    predicted: V
    proposals: T[]
    gsn: number
    lsn: number    // local edits s

    // committers specific values are part of the state; eg. we may share the location of the cursor.
    committer: { [key: number]: Cl }
}

function cellUrl(db: Dbms, table: string, ): string {
    return ""
}

// we can generate a function for each table to get cells?
type ProfileKey = {
    id: number
}
type Profile  = {
    id: number
    name: string
}
type DbTable<T,K> = {
    name: string
}
const profile :  DbTable<Profile,ProfileKey> = { name: "profile"}

export interface Editor<T,V,Cl> {
    el: HTMLInputElement
    cell: CellState<T, V, Cl>
}

export function createCell(db: Dbms, table: DbTable<T,K>, attr: (keyof T), key: K ) {
    const url = cellUrl(db, table.name, attr, key)
    const r : CellState =  {
        value: undefined,
        predicted: undefined,
        proposals: [],
        gsn: 0,
        lsn: 0,
        committer: {}
    }
    return r
}
export function createEditor3<T,K>(db: Dbms,t: DbTable<T,K>, attr: (keyof T), key: K ) {
    
    const r : Editor =  {
      
    }
    return r
}




type Plugin<T> = (e: Editor<T>) => void



const createEditor2 = (key: StepValue, plugins?: Plugin[]) => {
    let el: HTMLInputElement | null = null
    // steps from listen are canonical
    key.listen((v) => {
        el!.value = v.
    })
    const onInput = (e: any) => {
        // steps from dom are proposals
        key.write([])
    }
    createEffect(() => {
        el!.addEventListener("oninput", onInput)
    })
    onCleanup(() => el!.removeEventListener("oninput", onInput));
    const ed: Editor = {
        el: el!,
        key: key,
        state: {}
    }
    return [edref, ed] as const

}

// update needs to merge the editor with the dom: Data, Selection
// call when the step changes, call when 
export const updateEditor = (e: Editor, tx: Tx) => {

}
// declare module "solid-js" {
//     namespace JSX {
//         interface Directives {  // use:model
//             editor: StepValue;
//         }
//     }
// }

function edref(el: HTMLInputElement) {
}
function valid(ed: Editor) {
    return true
}

interface DbPtr<T,K> {
    db: Db
}


function dbPtr( ){
}

type refset = (el: HTMLInputElement) => void
export type dbstr = string
export function createEditor(d: dbstr) : [refset, Editor<LWW,string, Committer>] {
    const ed = { } as any
    return [(el: HTMLInputElement) => {}, ed]
}