import "./index.css"
import { ErrorBoundary, Match, Switch, render } from "solid-js/web"
import { LoginPage, RecoverPage, initWs, } from '../../../packages/ui/src'
import { DefaultRoute, Route, Router, Routes, useLocation } from "../../../packages/ui/src/core/dg"

function App() {
    let s = `ws://${window.location.host}/embed/wss`
    s = "ws://localhost:8080/embed/wss"
    initWs(s)
    const loc = useLocation()
    return <Router><div>
        <ErrorBoundary fallback={(e) => <div>{e.message}</div>}>
            <Routes>
                <Route path="/" component={() => <LoginPage createAccount='/MBRR/iCore/Contacts/CreateAccount.aspx' />} />
                <Route path="/recover" component={RecoverPage} />
                <DefaultRoute>
                    <div>404 "{JSON.stringify(loc())}"</div>
                </DefaultRoute>
            </Routes>
        </ErrorBoundary>

    </div></Router>
}
render(() => (<App />), document.getElementById("app")!)

