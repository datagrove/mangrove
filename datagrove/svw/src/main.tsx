
import { createEffect, createSignal } from "solid-js"
import "./index.css"
import { render } from "solid-js/web"

const [h,setH] = createSignal("")
// Define "global" variables
export function App() {
    createEffect(async () => {
    
        setH(await (await fetch('https://pub-30964ddfca8d42c2a054a44b14c9da25.r2.dev/test_dg_main/index.html')).text())
    })
    return <>
        <iframe src="https://www.w3schools.com" title="W3Schools Free Online Web Tutorials"></iframe>
        <pre>
            {h()}
        </pre>
    </>
}
render(() => (<App />), document.getElementById("app")!)