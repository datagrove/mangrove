import "./index.css"
import { render } from "solid-js/web"
import { LoginPage, RegisterPage, RegisterPage2, SettingsPage, initWs, LoggedIn, } from '../../../packages/ui/src'
import { Route, Router, Routes, useNavigate } from "../../../packages/ui/src/core/dg"
import { Show } from "solid-js"

// prefix is useful for proxies, but not here?
//const prefix = "/datagrove"

//const apps = defaultApps()

// this could be an argument to Routes.
// then we could have all the defaults, and override any of them.

import { createResource } from "solid-js";
import { UserContext, getUser } from "../../../packages/ui/src/core"

export function Main() {
    const [user] = createResource("1", getUser)
    return <Show when={user()}>
        <UserContext.Provider value={user()}>
            <LoggedIn />
        </UserContext.Provider>
    </Show>
}

function App() {
    const nav = useNavigate()
    //return <div>{`${prefix}/:ln/login`}</div>
    return <Routes>
        <Route path={`/:ln/login`} component={LoginPage} />
        <Route path={`/:ln/settings`} component={SettingsPage} />
        <Route path={`/:ln/register`} component={RegisterPage} />
        <Route path={`/:ln/register2`} component={RegisterPage2} />

        <Route path="/:ln/:app/*" component={Main} />
        <Route path="*" component={Main} />
    </Routes>
}

let s = `ws://${window.location.host}/wss`
s = `ws://localhost:3000/wss`
initWs(s)
render(() => (<Router><App /></Router>), document.getElementById("app")!)


