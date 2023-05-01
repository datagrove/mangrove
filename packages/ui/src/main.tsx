import "./index.css"
import { render } from "solid-js/web"
import { simpleRouter } from "./core/dg"
import { LoginPage } from "./login"

function HomePage() {
    simpleRouter()

    // act like a router; event for when the route changes
    // initial choice of "page" is based on the route

    return <div>
        <LoginPage/>
    </div>
}

render(() => <HomePage />,document.getElementById("app")!)

