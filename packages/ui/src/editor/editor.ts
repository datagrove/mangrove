import { EditorState, Transaction } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema, Node, DOMParser as PmParser, DOMSerializer } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"
import { exampleSetup } from "prosemirror-example-setup"
import { JSXElement, onMount } from "solid-js"
import { Step } from "prosemirror-transform"
import { history } from 'prosemirror-history'
import './pm.css'

const mySchema = new Schema({
    nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
    marks: schema.spec.marks
})

function html2doc(html: string  ){
const nd = new DOMParser().parseFromString(html, "text/html")
   return  PmParser.fromSchema(mySchema).parse(nd)
}
function view2html(e: EditorView) {
    const fragment= DOMSerializer.fromSchema(mySchema).serializeFragment(e.state.doc.content)
    let tmp = document.createElement("div");
    tmp.appendChild(fragment);
    return tmp.innerHTML;
}

// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.
// needs to be markdown schema, needs to be 


export class Editor {
    view: EditorView | undefined
    mount(el: HTMLElement) {
        let state = EditorState.create({
            doc: html2doc(""),
            plugins: [
                ...exampleSetup({ schema: mySchema, history: false }),
                history(),
            ],
        })

        // dispatch transaction will 
        this.view = new EditorView(el!, {
            state: state
        })
    }
    
    set text(x: string) {
        let state = EditorState.create({
            schema: this.view?.state.schema, 
            doc: html2doc(x), 
            plugins: this.view?.state.plugins});
        this.view?.updateState(state)
    }
    get text() {
        return this.view?view2html(this.view):""

    }
}
