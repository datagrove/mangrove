import "./index.css"
import {  ErrorBoundary, render } from "solid-js/web"
import { LoginPage, simpleRouter } from '../../../packages/ui/src'

function App() {
    simpleRouter()
    return <div>
        <ErrorBoundary fallback={(e)=> <div>{e.message}</div>}>
        <LoginPage/>
        </ErrorBoundary>
    </div>
}
render(() => (<App />),document.getElementById("app")!)


