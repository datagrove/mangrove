

// A tuple can contain atomic values or it can have structured values
// We can have a shadow copy of the canonical tuple we last saw from the host
// We can have an in-memory copy of the tuple we last handed to the editor

// in background we can create a provence index that shows the history of the tuple changes. not on the fast path.

import { Db, Tx } from "."

interface Structured {
    attribute: { [key: string]: string }
    children: Structured[]
}
interface Tuple {
    _id: number,  // globally or universally unique id. universal is obtained  from the host
    _uid: number, // universal id.
    _table: string,
    [key: string]: number | string | Structured
}

// a pinned tuple has been given to the editor, keep it in memory until the editor closes it.
// tuples can be server ahead, server behind, both, or neither.
// we don't update a tuple unless it has been pinned. 
// if we get an update to 

// before we sync any tuple to the host, we first get a uuid from the host the uuid is used when syncing with the host.
interface PinnedTuple {
    server: Tuple
    editor: Tuple


    
}


class TupleEditor {
    // we might local numbers are negative.
    pinned: Map<number, PinnedTuple> = new Map() 
    site: Map<string, Map<string, 

}

// these can't fail; they apply the delta from the editor and advance the local version number.
function syncFromEditor(tuple: Tuple) {


}


// these can't fail; they always just apply the delta from the server and advance the universal version number. If the tuple has been pinned then we let the editors that pinned it known and send them the delta or new value. which one is specified in the pin command.
export async function syncFromServer(tx: Tx ) {
    
}

let _next = 0
export async function getIds(n: number) : Promise<number[]> {

    // get these from the server though.
    let a = new Array<number>(n)
    for (let i=0; i<n; i++)
        a[0] = _next++
    return a
}

// we 
async function reconcile(te: TupleEditor, db: Db, ) {
    
    let pr : Promise<any>[] = []
    let servers: string[] =[]
    for (let s of servers) {

        reconcile1()
    }
    await Promise.all(pr)
}

// some transactions should be mergeable, but maybe not all. merging transactions that have different key sets can backfire, since some tx may fail that wouldn't otherwise. only merge consecutive updates to the same key (typing)
// the 
async function siteCommit(){
    return [true, 100]
}
async function reconcile1(te: TupleEditor, db: Db, server: string, site: string) {
    // if we have new local nodes, we first get a global  id for them
    // get a list of dirty tuples for this server. If any new insertions, get ids for them.

    const tx = db.begin("","")
    "select lsn, tx  from unsynched"
    // decode, get the inserts, modify them into updates against new allocated gid.
    "update {table} set gid=? where id=?"
    "update dirty set gid=? where id=?"
    tx.commit()


    // we can send a windo, but transactions after a failed transactions are ignored. it seems somewhat easier to reason about
    // if we only apply the transactions in order.
    for () {
        const [ok,siteVersion] = await siteCommit()
        if (!ok) {
            // a failure may advance our version of the site.
            // before starting again we need to wait until reconcile down 
            return

        }
    }
    

    // 
    "delete from local where id = ?"

} 