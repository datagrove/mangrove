import "./index.css"
import { render } from "solid-js/web"
import { LoginPage, SettingsPage, initWs, } from '../../../packages/ui/src'
import { Route, Router, Routes, useNavigate } from "../../../packages/ui/src/core/dg"

const prefix = "/datagrove"

const catchall = () => {
    const nav = useNavigate()
    nav(`${prefix}/en/login`)
    return <div>catchall</div>
}
function App() {
    const nav = useNavigate()
    //return <div>{`${prefix}/:ln/login`}</div>
    return <Routes>
        <Route path={`${prefix}/:ln/login`} component={LoginPage} />
        <Route path={`${prefix}/:ln/settings`} component={SettingsPage} />
        <Route path="/*" component={catchall} />
    </Routes>
}

let s = `ws://${window.location.host}${prefix}/wss`
s = `ws://localhost:3000/wss`
initWs(s)
render(() => (<Router><App /></Router>), document.getElementById("app")!)

