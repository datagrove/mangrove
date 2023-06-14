
import { Router } from "@solidjs/router"
import { RichTextEditor } from "../../../packages/ui/src/lexical"
import "./index.css"
import { render } from "solid-js/web"





type Listener = (p: JsonPatch[]) => void

let n = 0
function addIds(p: any) : object {
	if (!p) return p
	p["gid"] = n++
	for (let k in p) {
		if (typeof p[k] === "object") {
			addIds(p[k])
		}
	}
	return p
}
const sample2 = addIds(sample)


// to make the patches work we need to have global id; 
class Prov implements LexicalProvider {
	buffer = new Map<string, Set<Listener>>()
	

	async open(path: string, onChange: Listener): Promise<[string, Listener]> {
		let b = this.buffer.get(path)
		if (b) {
			b.add(onChange)
		} else {
			this.buffer.set(path, new Set([onChange]))
		}
		const  chall = (p: JsonPatch[]) => {
			let b = this.buffer.get(path)
			if (b) {
				b.forEach((fn) => fn(p))
			}
		}
		return [JSON.stringify(sample2), chall]
	}
	async close(listen: Listener) {

	}

}

// experiment with lexical 
export function DoubleEditor() {
	// normally there is one tabstate context
	// here we want three for testing.

	// simulate two tabs with two panes.
	const p = new Prov()

	return <><LexicalContext.Provider value={p}>
		<RichTextEditor path={"0"} />
		<RichTextEditor path={"0"} />
	</LexicalContext.Provider>
	</>
}
export function App() {
	return <DoubleEditor />
}
render(() => (<Router><App /></Router>), document.getElementById("app")!)
