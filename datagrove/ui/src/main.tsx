import "./index.css"
import { render } from "solid-js/web"
import { HomePage, LoginPage, RegisterPage, RegisterPage2, SettingsPage, initWs, } from '../../../packages/ui/src'
import { Route, Router, Routes, useNavigate, useParams } from "../../../packages/ui/src/core/dg"
import { JSXElement, Show, createEffect } from "solid-js"
import tippy from "tippy.js"

// prefix is useful for proxies, but not here?
//const prefix = "/datagrove"

//const apps = defaultApps()

// this could be an argument to Routes.
// then we could have all the defaults, and override any of them.




function App() {
    const nav = useNavigate()
    //return <div>{`${prefix}/:ln/login`}</div>
    return <Routes>
        <Route path={`/:ln/login`} component={LoginPage} />
        <Route path={`/:ln/settings`} component={SettingsPage} />
        <Route path={`/:ln/register`} component={RegisterPage} />
        <Route path={`/:ln/register2`} component={RegisterPage2} />

        <Route path="/:ln/:app/*" component={HomePage} />
    </Routes>
}

let s = `ws://${window.location.host}/wss`
s = `ws://localhost:3000/wss`
initWs(s)
render(() => (<Router><App /></Router>), document.getElementById("app")!)

//         <Route path={`${prefix}/:ln/home`} component={HomePage} />

export function TippyButton() {
    let el:HTMLButtonElement
    createEffect(() => {
        tippy(el as any, {
            content: 'My tooltip'
        })
    })
    
    return <button ref={el!} >My tippy button</button>
}

//render(() => (<TippyButton/>), document.getElementById("app")!)