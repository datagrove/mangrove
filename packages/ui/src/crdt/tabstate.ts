import { Accessor, createContext, createSignal, onCleanup, useContext } from "solid-js"
import { LocalStateClient } from './localstate_client'
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

export interface Selection { 
    start: number
    end: number
}
// one pane with one multi-selection-cursor
class EditorState {
    pri = Math.floor(Math.random() * 0x1000000);
    ser = 0; // increments for each pane, is this needed? do two panes need two states? probably.
    n = 0
    pending: Op[] = []
    oldText = "";

    docState = new DocState();
    peer = new OtPeer();

    constructor(public ctx: TabState, public path: string,public ver: Accessor<number>, public setVer: (_:number)=>void) {
    }

    // 
    sync(patch: JsonPatch[], sel: Selection): [JsonPatch[],Selection] {
        // upd(value: string, selectionEnd: number) {
        //     var diff = this.getDiff(oldText, value, selectionEnd);
        //     var ops = lc.diffToOps(diff, docState);
        //     // apply ops locally
        //     for (var i = 0; i < ops.length; i++) {
        //         docState.add(ops[i]);
        //     }
        //     this.write(props.path, ops);
        //     console.log('ops:' + JSON.stringify(ops));
        //     console.log('docstate: ' + docState.get_str());
        //     oldText = el.value;
        // }
    
        // call back to the editor to get selection? the point of this
        this.docState.points = [sel.start, sel.end];
        var rev = this.docState.ops.length;
        for (var i = 0; i < ops.length; i++) {
            this.peer.merge_op(this.docState, ops[i]);
        }
        if (rev < this.docState.ops.length) {
            lc.write(this.path, this.docState.ops.slice(rev))
        }
        let r = this.docState.get_str();
        this.oldText = r;
        sel.start = this.docState.points[0];
        sel.end = this.docState.points[1];

        let p = {
            op: "replace",
            path: "",
            value: r
        }
        return [patch, sel]
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

