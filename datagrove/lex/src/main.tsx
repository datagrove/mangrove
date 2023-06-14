
import { Router } from "@solidjs/router"
import { RichTextEditor } from "../../../packages/ui/src/lexical"
import "./index.css"
import { render } from "solid-js/web"
import { SyncPath, TabState } from "../../../packages/ui/src/mvr"

// experiment with lexical 
export function DoubleEditor() {
	// normally there is one tabstate context
	// here we want three for testing.

	// simulate two tabs with two panes.

	return <><TabState>  // tab level state, starts shared worker
		<SyncPath path={"sample"} fallback={<div>Loading...</div>}>
			<RichTextEditor />  // editor level state
		</SyncPath>
		<SyncPath path={"sample"} fallback={<div>Loading...</div>}>
			<RichTextEditor />  // editor level state
		</SyncPath>
	</TabState>
	</>
}
export function App() {
	return <DoubleEditor />
}
render(() => (<Router><App /></Router>), document.getElementById("app")!)
