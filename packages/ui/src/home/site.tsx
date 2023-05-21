import { useLocation } from "@solidjs/router"
import { JSXElement, Show, Suspense, createResource, createSignal } from "solid-js"
import { TextViewer, TextEditor } from "../lexical"
import { SettingsViewer } from "./settings"
import { FolderViewer, ChatViewer, WhiteboardViewer, SheetViewer, CodeViewer } from "./viewer"
import { DocumentContext, Viewer, getDocument, usePage } from "../core"

// viewers are selected by the document type, can be overridden by the hash
export type ViewerMap = {
    [key: string]: Viewer
}
const builtinViewers: ViewerMap = {
    "folder": { default: () => <FolderViewer /> },
    "text": { default: () => <TextViewer /> },
    "text-edit": { default: () => <TextEditor /> },
    "chat": { default: () => <ChatViewer /> },
    "settings": { default: () => <SettingsViewer /> },
    "whiteboard": { default: () => <WhiteboardViewer /> },
    "sheet": { default: () => <SheetViewer /> },
    "code": { default: () => <CodeViewer /> },
    "form": { default: () => <div>Form</div> } // can also be perspective of text?
}
export const [viewers, setViewers] = createSignal(builtinViewers)

// this should use an iframe
// it has to look at the hash to see edit or view
export function SiteViewer() {
    const sp = usePage()
    const page = useLocation()
    const path = page.pathname.split("/").pop()
    const hash = page.hash.split("#")[0]

    const viewer = (doctype?: string): () => JSXElement => {
        const openWith = sp.viewer;
        doctype ??= ""
        let vn = openWith ? doctype + "-" + openWith : doctype
        const vt = viewers()[vn]
        if (!vt) return () => <div>no viewer {vn}</div>
        return vt.default
    }
    const [doc] = createResource(sp.doc, getDocument)

    return <div>
        < Suspense fallback={< div > Loading document</div >}>
            <Show when={doc()}><DocumentContext.Provider value={doc()}>
                {viewer(doc()!.type)()}
            </DocumentContext.Provider></Show>
        </Suspense >
    </div>
}
