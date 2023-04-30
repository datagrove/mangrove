import "./index.css"
import { Route, Router, Routes, useNavigate } from "@solidjs/router"
import { effect, render } from "solid-js/web"
import { LoginPage } from "./login/login"

function Home() {
    const nav = useNavigate()
    effect(() => {
        nav("/en/login")
    })
    return <></>

}
function App() {
    // return <div> WTF?</div>
    return <Routes>
        <Route path="/" component={Home} />
        <Route path="/:ln/login" component={LoginPage} />
    </Routes>
}
render(() => (
        <Router >
            <App />
        </Router>
    ),
    document.getElementById("app")!
)
