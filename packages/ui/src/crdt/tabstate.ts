import { Accessor, createContext, createSignal, onCleanup, useContext } from "solid-js"
import { LocalStateClient } from './localstate_shared'
import { JsonPatch } from "../lexical/sync"
import { DocState, OtPeer } from "./ot_toy"
import { Op } from "./crdt"
// most of the work is done in the tabstate because the parsed document lives here.
// editorstate transforms the selection?

export const TabStateContext = createContext<TabState>()
export const useTabState = () => useContext(TabStateContext)

export type LengthListener = (x: number) => void

interface TabStateConfig {
}
export class TabState {
    open_ = new Map<string, Set<EditorState>>()
    pending = new Map<number, Promise<any>>()
    constructor(public lc: LocalStateClient, config?: TabStateConfig) {
    }
    write(path: string, op: Op[]){
        
    }
}

export function createEditor(path: string): EditorState {
    const us = useTabState()!
    let s = us!.open_.get(path)
    if (!s) {
        s = new Set<EditorState>()
        us.open_.set(path, s)
        us.lc.addListener(path, (x: number) => {
            for (let o of s!) {
                o.setVer(x)
            }
        })
    }

    const [ver, setVer] = createSignal<number>(0)
    const r = new EditorState(us!, path,ver,setVer);
    onCleanup(()=>{
        s?.delete(r)
        if (s?.size==0){
            us.open_.delete(path)
            us.lc.removeListener(path)
        }
    })
    s.add(r)
    return r
}
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
// one pane with one multi-selection-cursor
class EditorState {
    pri = Math.floor(Math.random() * 0x1000000);
    ser = 0; // increments for each pane, is this needed? do two panes need two states? probably.
    n = 0
    ops: Op[] = []
    oldText = "";

    docState = new DocState();
    peer = new OtPeer();

    constructor(public ctx: TabState, public path: string,public ver: Accessor<number>, public setVer: (_:number)=>void) {
    }

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
    syncUp(patch: JsonPatch[], sel: Selection): void {
        //we need to convert the patch to ops. then we can pack in and send it off to 

        //upd(value: string, selectionEnd: number) {
        const value = patch[0].value
        var diff = simpleDiff(this.oldText, value, sel.end);
        var ops = this.diffToOps(diff);
        // apply ops locally
        for (var i = 0; i < ops.length; i++) {
            this.docState.add(ops[i]);
        }
        this.ctx.write(this.path, ops);
        console.log('ops:' + JSON.stringify(ops));
        console.log('docstate: ' + this.docState.get_str());
       this.oldText = value;

    
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

