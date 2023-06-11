
import { Router } from "@solidjs/router"
import { LexicalContext, LexicalProvider, RichTextEditor } from "../../../packages/ui/src/lexical"
import "./index.css"
import { render } from "solid-js/web"
import { JsonPatch } from "../../../packages/ui/src/lexical/sync"





// note no keys at all, if we add keys will they be preserved?
const sample = { "root": { "children": [{ "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "Welcome to the playground", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "heading", "version": 1, "tag": "h1" }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "In case you were wondering what the black box at the bottom is – it's the debug view, showing the current state of the editor. You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "quote", "version": 1 }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "The playground is a demo environment built with ", "type": "text", "version": 1 }, { "detail": 0, "format": 16, "mode": "normal", "style": "", "text": "@lexical/react", "type": "text", "version": 1 }, { "detail": 0, "format": 0, "mode": "normal", "style": "", "text": ". Try typing in ", "type": "text", "version": 1 }, { "detail": 0, "format": 1, "mode": "normal", "style": "", "text": "some text", "type": "text", "version": 1 }, { "detail": 0, "format": 0, "mode": "normal", "style": "", "text": " with ", "type": "text", "version": 1 }, { "detail": 0, "format": 2, "mode": "normal", "style": "", "text": "different", "type": "text", "version": 1 }, { "detail": 0, "format": 0, "mode": "normal", "style": "", "text": " formats.", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "paragraph", "version": 1 }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "Make sure to check out the various plugins in the toolbar. ", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "paragraph", "version": 1 }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "If you'd like to find out more about Lexical, you can:", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "paragraph", "version": 1 }, { "children": [{ "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "Visit the ", "type": "text", "version": 1 }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "Lexical website", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "link", "version": 1, "rel": null, "target": null, "title": null, "url": "https://lexical.dev/" }, { "detail": 0, "format": 0, "mode": "normal", "style": "", "text": " for documentation and more information.", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "listitem", "version": 1, "value": 1 }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "Check out the code on our ", "type": "text", "version": 1 }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "GitHub repository", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "link", "version": 1, "rel": null, "target": null, "title": null, "url": "https://github.com/facebook/lexical" }, { "detail": 0, "format": 0, "mode": "normal", "style": "", "text": ".", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "listitem", "version": 1, "value": 2 }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "Playground code can be found ", "type": "text", "version": 1 }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "here", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "link", "version": 1, "rel": null, "target": null, "title": null, "url": "https://github.com/facebook/lexical/tree/main/packages/lexical-playground" }, { "detail": 0, "format": 0, "mode": "normal", "style": "", "text": ".", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "listitem", "version": 1, "value": 3 }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "Join our ", "type": "text", "version": 1 }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "Discord Server", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "link", "version": 1, "rel": null, "target": null, "title": null, "url": "https://discord.com/invite/KmG4wQnnD9" }, { "detail": 0, "format": 0, "mode": "normal", "style": "", "text": " and chat with the team.", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "listitem", "version": 1, "value": 4 }], "direction": "ltr", "format": "", "indent": 0, "type": "list", "version": 1, "listType": "bullet", "start": 1, "tag": "ul" }, { "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "Lastly, we're constantly adding cool new features to this playground. So make sure you check back here when you next get a chance ", "type": "text", "version": 1 }, { "detail": 0, "format": 0, "mode": "normal", "style": "", "text": ".", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "paragraph", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "root", "version": 1 } }

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
