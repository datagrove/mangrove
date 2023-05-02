import "./index.css"
import { Match, Switch, render } from "solid-js/web"
import { nav, simpleRouter } from "./core/dg"
import { LoginPage } from "./login"

function HomePage() {
    simpleRouter()

    // act like a router; event for when the route changes
    // initial choice of "page" is based on the route

    return <div>
        <Switch>
            <Match when={nav() == "/"} >
                <LoginPage /></Match>
            <Match when={nav() == "home"} >
                <div>Home</div>
            </Match>
            <Match when={true} >
                <div>404</div>
            </Match>
        </Switch>
        <div class='fixed top-0 left-0'>wtf? {nav()}</div>
    </div>
}

render(() => <HomePage />, document.getElementById("app")!)

