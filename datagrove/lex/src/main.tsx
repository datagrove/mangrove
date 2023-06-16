
import { Router } from "@solidjs/router"
import { RichTextEditor } from "../../../packages/ui/src/lexical"
import "./index.css"
import { render } from "solid-js/web"
import { DbDebugger, SyncPath, TabState } from "../../../packages/ui/src/mvr"

// experiment with lexical 

export function App() {
	return <><TabState>
		<div class='flex '>
		<div class=' w-1/2 overflow-auto'>
			<DbDebugger path={"sample"} /></div>
			<div class='w-1/2 '>
				<SyncPath path={"sample"} fallback={<div>Loading...</div>}>
					<RichTextEditor />
				</SyncPath>
				<SyncPath path={"sample"} fallback={<div>Loading...</div>}>
					<RichTextEditor />
				</SyncPath>
			</div>
		</div>
	</TabState>
	</>
}
render(() => (<Router><App /></Router>), document.getElementById("app")!)


// 	<div class='flex-1'><OtDebugger/></div>
/*
		<SyncPath path={"sample"} fallback={<div>Loading...</div>}>
			<div class='flex'>
				<div class='flex-1'><RichTextEditor /> </div>
			
			</div>
		</SyncPath>
		*/