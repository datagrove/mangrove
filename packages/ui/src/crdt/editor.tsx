

export function Editor(props: { path: string }) {
	let el: HTMLTextAreaElement

	let n = 0; // length we know about.
	return <div>
		<textarea onInput={()=>props.ds.upd(el.value, el.selectionEnd)} class='bg-neutral-900' ref={el!} cols="80" rows="6" ></textarea>
	</div>
}




export function DoubleEditor() {
	let wc = [
		new LocalState(),
		new LocalState()
	  ]  // shared for now

	const lc : TabState[] = [0,1,2,3].map(e => {
		let [wt,mc] = createWorkerTest({

		})
		return new TabState(wt, wc[e>>1])
	})

	// simulate two tabs with two panes.
	// we should simulate two LocalStates as well.
	return <><For each={lc}>{(e,i) => {
			return <TabStateContext.Provider value={lc[0]}>
				<Editor path={"0"}  />
				<Editor path={"0"}  />
				</TabStateContext.Provider>
		}}</For>
	</>
}