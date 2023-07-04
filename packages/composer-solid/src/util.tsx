import { JSXElement } from "solid-js";

export function DebugWindow(props: { children: JSXElement }) {
    return <pre class=' fixed top-0 left-0 overflow-auto w-64 h-screen z-50 bg-black'>
        {props.children}
    </pre>
}