import { Accessor, createContext, createEffect, createResource, createSignal, onCleanup, useContext } from "solid-js"
import { LocalStateClient, ScanQuery } from './localstate_shared'
import { JsonPatch } from "../lexical/sync"
import { DocState, OtPeer } from "./ot_toy"
import { Op } from "./crdt"
import { LensRef, QuerySchema, Tx } from "../dblite/schema"
import { TableUpdate } from "../db"
// most of the work is done in the tabstate because the parsed document lives here.
// editorstate transforms the selection?

export const TabStateContext = createContext<TabState>()
export const useTabState = () => useContext(TabStateContext)

export type LengthListener = (x: number) => void

// maybe change this to answer more questions like who changed this last, presence, or ??
type Version = number

interface TabStateConfig {
}
export class TabState {
    range = new Map<number, RangeSource<any,any>>()
    open_ = new Map<string, Set<EditorState>>()
    pending = new Map<number, Promise<any>>()
	next = 0
    constructor(public lc: LocalStateClient, config?: TabStateConfig) {
    }
 
    async commit(tx: Tx){
       return this.lc.commit(tx)            
    }
}

// maybe this should take a keyed instead? or as an alternative?
// effectively this would require that this is in addition to a scan, which is normal.
// does rowid need to be a signal in order to be reactive?
// this should be like create resource, where we refetch when the rowid or column changes.
// note that a spreadsheet is a single value, so we need to be able to create editors on pieces of a value. this is giving us access to a document, which is more general than a single bit of text. the primary reason for a document to exist is that it abstracts consensus vectors (generalizing a blob), where the database provides consensus sets.

// creating an editor may access multiple tables



// typically here at least the column and the table are fixed, so we should probably follow solid's pattern in allow non-reactive values to be passed in.
export function createSheetEditor(table: ()=>string, rowid: ()=>number, column: ()=>string, setVer: (x:Version)=>void ): SheetState {
    const ctx = useTabState()!
    const r = new SheetState(ctx, setVer)
    createEffect( () => {
        r.setLens({
            table: table(), 
            rowid: rowid(), 
            column: column()
        })
    })
    return r
}

export function createTextEditor(table: ()=>string, rowid: ()=>number, column: ()=>string, setVer: (x:Version)=>void): EditorState {
    const ctx = useTabState()!
    const r = new EditorState(ctx, setVer)
    createEffect( () => {
        r.setLens({
            table: table(), 
            rowid: rowid(), 
            column: column()
        })
    })
    return r
}

export function createSlideEditor(table: ()=>string, rowid: ()=>number, column: ()=>string, setVer: (x:Version)=>void): SlideState {
    const ctx = useTabState()!
    const r = new EditorState(ctx, setVer)
    createEffect( () => {
        r.setLens({
            table: table(), 
            rowid: rowid(), 
            column: column()
        })
    })
    return r
}

// sitemaps are specialized case of document. Unclear if we need special state for it, or just change the component that edits it.
// export function createSitemapEditor(

// )


// helper function to do basics of each?


export function simpleDiff(oldText: string, newText: string, cursor: number) : [number,number, string] {
	var delta = newText.length - oldText.length;
	var limit = Math.max(0, cursor - delta);
	var end = oldText.length;
	while (end > limit && oldText.charAt(end - 1) == newText.charAt(end + delta - 1)) {
		end -= 1;
	}
	var start = 0;
	var startLimit = cursor - Math.max(0, delta);
	while (start < startLimit && oldText.charAt(start) == newText.charAt(start)) {
		start += 1;
	}
	return [start, end, newText.slice(start, end + delta)];
}

export interface Selection { 
    start: number
    end: number
}






// when create a lens from a LensRef we need to create a signal
// the signal will change when the database cell is changed from outside the editor
// when the signal changes, the editor should call sync with its changes.
// if there are no changes, then the editor will get patches to take it to the new version. If there are changes, then the editor will get an empty patch, and another version update to call signal it to sync again. eventually there will be no changes and the editor will be patched to the newest version. 
// when editor is offline, the "newest version" is only synced with other tabs on the same machine (using a sharedworker). when the device comes back online, the sharedworker will follow essentially the same protocol: send all the patches, and when they catch up, then swap to the newest version. Note that this can result in multiple distinct "newest versions" depending your perspective: newest in editor, newest in tab, newest host version in tab, newest host version in localstate, newst in localstate, and the universal newest stable


// building a base state implies that the row already exists; you must create the row in the database and get it's rowid before you can create the editor.
class BaseState {
    path?: LensRef

	constructor(public ctx: TabState, public setVer: (_:number)=>void) {
		
    }

    async setLens(path: LensRef) {
        this.path = path
        // seems like we need an api for this unless we want to create a scan which seems like overkill
    }

    // Extend JsonPatch to all text ops and range changes? is this somehow different?
    async merge(value: JsonPatch) {
        if (!this.path) return
        const upd : TableUpdate = {
            op: 'merge',
            tuple: {
                rowid: this.path.rowid,
                [this.path.column]: value
            }
        }
		const tx : Tx = {
			siteid: 0, // not used
			table: {
				[this.path.table]: [upd]
			}
		}
        this.ctx.commit(tx);
    }

}

interface SheetSelection {

}


class SheetState extends BaseState {

    // is this a practical way? selection is too simple for sure
    sync(patch: JsonPatch, sel: SheetSelection) {

    }

}
class SlideState extends BaseState{

}

// one pane with one multi-selection-cursor
class EditorState extends BaseState {
    pri = Math.floor(Math.random() * 0x1000000);
    ser = 0; // increments for each pane, is this needed? do two panes need two states? probably.
    n = 0
    ops: Op[] = []
    oldText = "";

    docState = new DocState();
    peer = new OtPeer();



    // to sync we need to get on the same version as the host. rather than spend a lot of cycles transforming we simply keep wait until the consensus version catches up (includes all the local changes) and then replace the document entirely. 

    // when the editor has changes, it uses syncUp, otherwise it uses syncdown 
    // 
    syncDown(sel: Selection) : [JsonPatch[], Selection]{
        // call back to the editor to get selection? the point of this
        this.docState.points = [sel.start, sel.end];
        var rev = this.docState.ops.length;
        for (var i = 0; i < this.ops.length; i++) {
            this.peer.merge_op(this.docState, this.ops[i]);
        }
        // we don't write back our state, no one cares.
        // if (rev < this.docState.ops.length) {
        //     ctx.write(this.path, this.docState.ops.slice(rev))
        // }
        let r = this.docState.get_str();
        this.oldText = r;
        sel.start = this.docState.points[0];
        sel.end = this.docState.points[1];

        let p : JsonPatch = {
            op: "replace",
            path: "",
            value: r
        }
        return [[p], sel]
    }

    // maybe here we can improve the patch from the course patch we get from lexical to a fine grain one? or maybe start over?
    sync(patch: JsonPatch[], sel: Selection): [JsonPatch[], Selection] {
		if (patch.length == 0) {
			return this.syncDown(sel);
		}
        //we need to convert the patch to ops. then we can pack in and send it off to 

        //upd(value: string, selectionEnd: number) {
        const value = patch[0].value
        var diff = simpleDiff(this.oldText, value, sel.end);
        var ops = this.diffToOps(diff);
        // apply ops locally
        for (var i = 0; i < ops.length; i++) {
            this.docState.add(ops[i]);
        }
		// this needs to be a transaction, that uses our local lensref
		
		// does it make sense to have server and site separate here?
		// won't they be in every tuple as a siteid? maybe the transaction could take the siteid. Maybe the siteid is indirectly from usePage?
        this.merge(ops);

        console.log('ops:' + JSON.stringify(ops));
        console.log('docstate: ' + this.docState.get_str());
       this.oldText = value;

		return [[],sel]
    }

    getid() {
        return (this.pri * 0x100000) + this.ser++;
    }
    diffToOps(diff: [number,number,string]) {
        var start = diff[0];
        var end = diff[1];
        var newstr = diff[2];
        var result = [];
        for (var i = start; i < end; i++) {
            result.push({ pri: this.pri, ty: 'del', ix: this.docState.xform_ix(i), id: this.getid() });
        }
        var ix = this.docState.xform_ix(end);
        for (let i = 0; i < newstr.length; i++) {
            result.push({ pri: this.pri, ty: 'ins', ix: ix + i, id: this.getid(), ch: newstr.charAt(i) });
        }
        return result;
    }



}

// we need to pack the keys of any new tuples or diffing won't work?
// maybe all tuples just come packed though? the go server doesn't need this.
// the worker needs this code to keep it up to date.
// we could compile it into the worker for now.
export class RangeSource<Key,Tuple> {
    constructor(public db: TabState, 
        public q: ScanQuery<Key,Tuple>, 
        public schema: QuerySchema<Key>, 
        public listener: (s: ScanDiff) => void) {
        // we have to send db thread a query
    }
    async update(n: Partial<ScanQuery<Key,Tuple>>) {

        // we have to send db thread an update query
        this.db.lc.updateScan(this.q.handle, n)
    }
    close() {
        this.db.lc.closeScan(this.q.handle) 
    }
}


// use the features of localState, implicitly uses tabstate provider
export function createQuery<Key, Tuple>(
    t: QuerySchema<Key>,
    q: Partial<ScanQuery<Key, Tuple>>,
    listener: (s: ScanDiff) => void): RangeSource<Key, Tuple> {

	const db = useTabState()!
    // assign q a random number? then we can broadcast the changes to that number?
    // we need a way to diff the changes that works through a message channel.
    // hash the key -> version number, reference count?
    // the ranges would delete the key when no versions are left.
    // we send more data than we need to this way?
    q.handle = db.next++

	// change this to send scan to local state.
	// the range source we create will have options to use the update scan
	// clean up will close
    db.lc.scan(q as ScanQuery<Key, Tuple>)

    const rs = new RangeSource<Key, Tuple>(db, q as ScanQuery<Key, Tuple>, t, listener)
	onCleanup(() => {
		rs.close()
	})
    db.range.set(q.handle, rs)
    return rs
}


