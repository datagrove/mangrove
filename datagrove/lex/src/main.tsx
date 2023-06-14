
import { Router } from "@solidjs/router"
import { RichTextEditor } from "../../../packages/ui/src/lexical"
import "./index.css"
import { render } from "solid-js/web"
import { SyncPath, TabState } from "../../../packages/ui/src/mvr"

// experiment with lexical 

export function App() {
	return <><TabState> 
	<SyncPath path={"sample"} fallback={<div>Loading...</div>}>
		<RichTextEditor /> 
	</SyncPath>
	<SyncPath path={"sample"} fallback={<div>Loading...</div>}>
		<RichTextEditor /> 
	</SyncPath>
</TabState>
</>
}
render(() => (<Router><App /></Router>), document.getElementById("app")!)
