
import { Router } from "@solidjs/router"
import { RichTextEditor } from "../../../packages/ui/src/lexical"
import "./index.css"
import { ErrorBoundary, render } from "solid-js/web"
import { DbDebugger, SyncPath, TabState } from "../../../packages/ui/src/db"

// experiment with lexical 

// procs are {name}-{table}-{attribute}
// keys are divided by / and url encoded
// site is take from the left most subdomain, or ?site can be used to override
// overrides can be disabled in production as they potentially reduce security currently (maybe sandboxes can get around this though, future work)
const p = "http://localhost/sample/tool/read-note-content/sample?site=datagrove.com"
export function App() {
	return <><TabState>
		<div class='flex '>
		<div class=' w-1/2 overflow-auto'>
			<DbDebugger path={"sample"} /></div>
			<div class='w-1/2 '>
				<ErrorBoundary fallback={(e:Error)=><div>error</div>}>
				<SyncPath path={p} fallback={<div>Loading...</div>}>
					<RichTextEditor />
				</SyncPath>
				</ErrorBoundary>
				<SyncPath path={p} fallback={<div>Loading...</div>}>
					<RichTextEditor />
				</SyncPath>
			</div>
		</div>
	</TabState>
	<TabState>
			<SyncPath path={p} fallback={<div>Loading...</div>}>
					<RichTextEditor />
			</SyncPath>
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