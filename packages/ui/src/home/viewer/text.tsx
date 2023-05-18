import { createResource } from "solid-js";
import RichTextEditor from "../../lexical/RichTextEditor";
import { SiteDocument, getDocument, useDocument } from "../store";


// we can use hash to see if we should show readonly or editable
// and potentially use multiple available editors "open with"
export function TextEditor() {

    return <RichTextEditor />
}

// resolved into dataurls? I'd rather not
async function readAll(doc: SiteDocument): Promise<string> {
    return "hello, world"
}

// note that as html / markdown we'll have to resolve links relative to the doc
export function TextViewer() {
    const doc = useDocument()
    const [h] = createResource(doc, readAll)
    // we may still have to wait here; we might get the type of the document but now need to read the rest of the document
    // or some large piece of it.
    return <div innerHTML={h()} />
}