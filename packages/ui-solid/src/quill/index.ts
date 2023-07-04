import  diff from 'fast-diff';

export type Attrm = undefined|(string|string[])[]
export enum Op {
    insertString = 0,
    retain = 1,
    delete = 2,
    insertObject = 3,
    insertInlineObject = 4,
    insertBreak = 5
}
// can I make it easy to sort so we get deterministic hashes?
export type Chunk = [string, Attrm ] | [1, number,Attrm ] | [2, number] | [3|4, string, any] | [5, Attrm]
export type QuillDoc = Chunk[]
export type QuillDelta = Chunk[]

export  function squash(q: QuillDelta[]) : QuillDelta {
    return q[0]
}

// provide log(n) operations


function merge(d1: QuillDoc, d2: QuillDoc, base: QuillDoc) : QuillDoc {
    
} 