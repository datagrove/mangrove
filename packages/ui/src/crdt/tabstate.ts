import { createContext, useContext } from "solid-js"

// most of the work is done in the tabstate because the parsed document lives here.

class CollabEditorViewset extends  Set<CollabEditorView> {
	// eventually this might allow a more clever editor to share its state better?
	// how would this work then?
}
export const TabStateContext = createContext()
export const useTabState = () => useContext(TabStateContext)

export type LengthListener = (x: number) => void

export class TabState {
	open_ = new Map<string,CollabEditorViewset>()
	pending = new Map<number, Promise<any>>()
	addListener(path: string, x: LengthListener) {

	}

	static async create() {
		// here we need to establish a connection the shared worker.
		const mc = new MessageChannel()
		mc.port1.onmessage = (e) => {
			const { method, params , id} = e.data
			if (id) {

			}
			switch (method) {
				case 'write':
					break
				case 'open':
					break
				case 'close':
					break
			}
		}
		wc.connect(mc)
	}

	read(path: string, start: number, end: number) {
		return keeper.read(path, start, end)
	}
	write(path: string, ops: Op[]) {
		counter.write(path, ops)
	}

	constructor(config?: any) {}
	open(path: string, onChange: ()=>void) {
		const r =  new CollabEditorView(this, path, onChange);
		let s = this.open_.get(path)
		if (!s) {
			s = new Set<CollabEditorView>()
			this.open_.set(path, s)
			counter.addListener(path, (x: number) => {
				for (let o of s!) {
					o.sync(x)
				}
			})
		}
		s.add(r)
	}
	close(path: string, r: CollabEditorView) {
		const s = this.open_.get(path)
		if (!s) return
		s.delete(r)
		if (s.size == 0) {
			this.open_.delete(path)
			counter.removeListener(path,)
		}
	}
}


// one pane with one multi-selection-cursor
class CollabEditorView{
	pri = Math.floor(Math.random() * 0x1000000);
	ser = 0; // increments for each pane, is this needed? do two panes need two states? probably.
	n = 0
	pending: Op[] = []


	constructor(public ctx: TabState, public path: string, onChange: ()=>void) {
 
		ctx.addListener(path, async (nx: number) => {
			// we can't assume we have all the edits here. were don't know what the editor is doing. we simply signal the editor, then the editor must call sync.
			console.log("length", nx)
			if (nx <= this.n) return
			this.pending = await ctx.read(this.path, this.n, nx) as Op[]
			this.n = nx
		})
	}
	// change to json patch here? we also need to get updates to the selection state
	// the selection state could be complex, is that patched as well?
	// maybe this needs to be one pane no matter what, so we can deal with selecton state. we don't want to call back into other panes?
	sync(patch: JsonPatch[]) : JsonPatch[] {
			console.log('from server:' + JSON.stringify(ops));

			// call back to the editor to get selection? the point of this
			docState.points = [el.selectionStart, el.selectionEnd];
			var rev = docState.ops.length;
			for (var i = 0; i < ops.length; i++) {
				peer.merge_op(docState, ops[i]);
			}
			if (rev < docState.ops.length) {
				lc.write(props.path, docState.ops.slice(rev))
			}
			el.value = docState.get_str();
			oldText = el.value;
			el.selectionStart = docState.points[0];
			el.selectionEnd = docState.points[1];
		return []
	}

	getid() {
        return (this.pri * 0x100000) + this.ser++;
    }
	diffToOps(diff: any[], docState: DocState) {
		var start = diff[0];
		var end = diff[1];
		var newstr = diff[2];
		var result = [];
		for (var i = start; i < end; i++) {
			result.push({ pri: this.pri, ty: 'del', ix: docState.xform_ix(i), id: this.getid() });
		}
		var ix = docState.xform_ix(end);
		for (let i = 0; i < newstr.length; i++) {
			result.push({ pri: this.pri, ty: 'ins', ix: ix + i, id: this.getid(), ch: newstr.charAt(i) });
		}
		return result;
	}
	getDiff(oldText: string, newText: string, cursor: number) {
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



	removeListener(id: string, x: LengthListener) {
		counter.removeListener(id, x)
	}


	get length() {
		return this.ctx.length(this.path)
	}
	get text() {
		return this.ctx.read(this.path, 0, this.length) as string
	}
	set text(t: string) {
		this.ctx.write(this.path, this.ctx.diffToOps(this.ctx.getDiff(this.text, t, 0), docState))
	}	
	

	var textElement = document.getElementById("text");
	var oldText = "";

	var docState = new DocState();
	var peer = new Peer();



	upd(value: string,selectionEnd: number) {
		var diff = this.getDiff(oldText, value, selectionEnd);
		var ops = lc.diffToOps(diff, docState);
		// apply ops locally
		for (var i = 0; i < ops.length; i++) {
			docState.add(ops[i]);
		}
		this.write(props.path, ops);
		console.log('ops:' + JSON.stringify(ops));
		console.log('docstate: ' + docState.get_str());
		oldText = el.value;
	}

}