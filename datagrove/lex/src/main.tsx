
import { Router } from "@solidjs/router"
import { RichTextEditor } from "../../../packages/ui/src/lexical"
import "./index.css"
import { render } from "solid-js/web"
import { OtDebugger, SyncPath, TabState } from "../../../packages/ui/src/mvr"

// experiment with lexical 

export function App() {
	return <><TabState>
		<SyncPath path={"sample"} fallback={<div>Loading...</div>}>
			<div class='flex'>
				<div class='flex-1'><RichTextEditor /> </div>
			
			</div>
		</SyncPath>
		<SyncPath path={"sample"} fallback={<div>Loading...</div>}>
			<div class='flex'>
				<div class='flex-1'><RichTextEditor /> </div>
			
			</div>
		</SyncPath>
	</TabState>
	</>
}
render(() => (<Router><App /></Router>), document.getElementById("app")!)


// 	<div class='flex-1'><OtDebugger/></div>