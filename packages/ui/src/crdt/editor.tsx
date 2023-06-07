import { For } from "solid-js";
import { useCloud } from "./cloud_context";
import { TabState, TabStateContext, useTabState } from "./tabstate";
import { cloud } from "solid-heroicons/solid";

import { LocalState } from "./localstate";


export function Editor(props: { path: string }) {
	let el: HTMLTextAreaElement

	let n = 0; // length we know about.
	return <div>
		<textarea onInput={()=>props.ds.upd(el.value, el.selectionEnd)} class='bg-neutral-900' ref={el!} cols="80" rows="6" ></textarea>
	</div>
}




export function DoubleEditor() {
	// normally there is one tabstate context
	// here we want three for testing.

	// we should have a way to make a tabstate that with differen localstates.

	// each tabstate needs a client to the LocalState
	const cloud = useCloud()
	if (!cloud) throw new Error("no cloud")



	const u1 = connect<LocalStateClient,TabStateClient>(cloud, "1")
	const u2 = connect<LocalStateClient,TabStateClient>(cloud, "2")

	const tab = [
		new TabState(u1),
		new TabState(u1),
		new TabState(u2),
	]


	// simulate two tabs with two panes.

	return <>
		<LocalStateContext.Provider value={u1}>
		<TabStateContext.Provider value={tab[0]}>
				<Editor path={"0"}  />
				<Editor path={"0"}  />
				</TabStateContext.Provider>
		</LocalStateContext.Provider>
		
		<LocalStateContext.Provider value={u2}>
				<TabStateContext.Provider value={tab[0]}>
				<Editor path={"0"}  />
				<Editor path={"0"}  />
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