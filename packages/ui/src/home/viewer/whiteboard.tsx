
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
