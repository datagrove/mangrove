import "./index.css"
import { ErrorBoundary, Match, Switch, render } from "solid-js/web"
import { LoginPage, simpleRouter } from '../../../packages/ui/src'
import { nav } from "../../../packages/ui/src/core/dg"

function App() {
    simpleRouter()
    return <div>
        <ErrorBoundary fallback={(e) => <div>{e.message}</div>}>
            <Switch>
                <Match when={nav() == ""} >
                    <LoginPage /></Match>
                <Match when={nav() == "home"} >
                    <div>Home</div>
                </Match>
                <Match when={true} >
                    <div>404</div>
                </Match>
            </Switch>
        </ErrorBoundary>

    </div>
}
render(() => (<App />), document.getElementById("app")!)

