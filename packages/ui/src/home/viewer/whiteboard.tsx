import { createRoot } from 'react-dom/client';
// do this without jsx? we need a different importer to work with react
// import { Excalidraw } from "@excalidraw/excalidraw";

// export function newExcalidraw(domNode) {
//     const root = createRoot(domNode);
//     root.render(<Excalidraw /> );
// }
import { onMount } from "solid-js"
// @ts-ignore
import { newExcalidraw } from "./exc"

export function WhiteboardViewer() {
    let el: HTMLDivElement
    onMount(() => {
        newExcalidraw(el)
    })
    return <div ref={el!} />
}
