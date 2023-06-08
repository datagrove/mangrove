
import "./index.css"
import { render } from "solid-js/web"
import { DoubleEditor } from '../../../packages/ui/src/crdt/editor'

export function App() {
    return <DoubleEditor/>
}
render(() => (<App />), document.getElementById("app")!)