import "./index.css"
import { render } from "solid-js/web"
import { LoginPage, RegisterPage, RegisterPage2, SettingsPage, initWs, LoggedIn, } from '../../../packages/ui/src'
import { Route, Router, Routes, useLocation, useNavigate } from "../../../packages/ui/src/core/dg"
import { Show, Switch, createEffect } from "solid-js"

// prefix is useful for proxies, but not here?
//const prefix = "/datagrove"

//const apps = defaultApps()

// this could be an argument to Routes.
// then we could have all the defaults, and override any of them.

import { createResource } from "solid-js";
import { UserContext, getUser, login } from "../../../packages/ui/src/core"
import { ViewDesc, createCells } from "../../../packages/ui/src/db/cell"
import { InputCell } from "../../../packages/ui/src/lib/input"

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
    const loc = useLocation()

    createEffect(()=>{
        if (!login()) {
            nav("/en/login")
            console.log("redirecting to login")
        }
    })
 
    const redir = () => {
         nav("/en/login")
         return <></>
    }
    const loginRoutes = () => {
        return <Routes>
        <Route path={`/:ln/login`} component={LoginPage} />
        <Route path={`/:ln/login`} component={LoginPage} />
        <Route path={`/:ln/settings`} component={SettingsPage} />
        <Route path={`/:ln/register`} component={RegisterPage} />
        <Route path={`/:ln/register2`} component={RegisterPage2} />
        <Route path="*" component={redir} />
        </Routes>
    }

    return <Show when={login()} fallback={loginRoutes()} >
        <Routes>
        <Route path="/:ln/:app/*" component={Main} />  
        <Route path="*" component={Main} />
        </Routes>
        </Show>
}
let s = `ws://${window.location.host}/wss`
s = `ws://localhost:3000/wss`
initWs(s)
render(() => (<Router><App /></Router>), document.getElementById("app")!)


    //return <div>{`${prefix}/:ln/login`}</div>
    //return <Switch fallback={<div>not found</div>}>