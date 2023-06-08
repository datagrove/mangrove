import { For, createEffect } from "solid-js";
import { useCloud } from "./cloud_context";
import { TabState, TabStateContext, createEditor, useTabState } from "./tabstate";
import { cloud } from "solid-heroicons/solid";
import { LocalState } from "./localstate";
import { LocalStateContext } from "./localstate_client";
import { JsonPatch } from "../lexical/sync";
import { Selection } from "./tabstate"
import { createLocalStateFake } from "./localstate_test";




export function Editor(props: { path: string }) {
	let el: HTMLTextAreaElement

	const patch = (j: [JsonPatch[], Selection]) => {
		const [p, sel] = j
		el.value = p[0].value
		el.selectionStart = sel.start
		el.selectionEnd = sel.end
	}
	const ed = createEditor(props.path)
	const change = (_: any) => {
		let r: JsonPatch[] = [
			{
				op: "replace",
				path: "",
				value: el.value
			}
		]

		ed.syncUp(r, {
			start: el.selectionStart,
			end: el.selectionEnd
		})
	}

	createEffect(() => change(ed.ver()))

	let n = 0; // length we know about.
	return <div>
		<textarea onInput={change} class='bg-neutral-900' ref={el!} cols="80" rows="6" ></textarea>
	</div>
}




export function DoubleEditor() {
	// normally there is one tabstate context
	// here we want three for testing.
	const u1 = createLocalStateFake()
	const u2 = createLocalStateFake()

	const tab = [
		new TabState(u1),
		new TabState(u1),
		new TabState(u2),
	]


	// simulate two tabs with two panes.

	return <>
		<LocalStateContext.Provider value={u1}>
			<TabStateContext.Provider value={tab[0]}>
				<Editor path={"0"} />
				<Editor path={"0"} />
			</TabStateContext.Provider>
		</LocalStateContext.Provider>

		<LocalStateContext.Provider value={u2}>
			<TabStateContext.Provider value={tab[0]}>
				<Editor path={"0"} />
				<Editor path={"0"} />
			</TabStateContext.Provider>
		</LocalStateContext.Provider>
	</>
}


/*
	// this only works if LocalState is an interface, not a class.
	const  lc1 = connect<LocalStateClient,Editor>(cloud)
	let wc = [
		s
		new LocalState()
	  ]  // shared for now

	const lc : TabState[] = [0,1,2,3].map(e => {
		let [wt,mc] = createWorkerTest({

		})
		return new TabState(wt, wc[e>>1])
	})

*/