import { Component, createEffect, createSignal, onCleanup } from "solid-js"
import { createEditor, dbstr } from "./server"



// create a enditor
// creating type
export const Inputx: Component<{ ptr: dbstr }> = (props) => {
    const [edref, ed] = createEditor(props.ptr)

    // when the editor changes we want to revalidate
    // we can do this with normal input onchange though

    return <div><input ref={edref} />
        <div>valid: </div>
    </div>
}