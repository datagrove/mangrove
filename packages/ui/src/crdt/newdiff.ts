

// A tuple can contain atomic values or it can have structured values
// We can have a shadow copy of the canonical tuple we last saw from the host
// We can have an in-memory copy of the tuple we last handed to the editor

import { Tx } from "../db"

interface Structured {
    attribute: { [key: string]: string }
    children: Structured[]
}
interface Tuple {
    _id: number,  // globally or universally unique id. universal is obtained  from the host
    _table: string,
    [key: string]: number | string | Structured
}

// a pinned tuple has been given to the editor, keep it in memory until the editor closes it.
// tuples can be server ahead, server behind, both, or neither.
interface PinnedTuple {


    
}


class TupleEditor {
    pinned: Map<number, PinnedTuple> = new Map()

}

// these can't fail; they apply the delta from the editor and advance the local version number.
function syncFromEditor(tuple: Tuple) {


}


// these can't fail; they always just apply the delta from the server and advance the universal version number. If the tuple has been pinned then we let the editors that pinned it known and send them the delta or new value. which one is specified in the pin command.
export async function syncFromServer(tx: Tx ) {
    
}

function reconcile(te: TupleEditor) {
    // get a list of dirty tuples.

} 