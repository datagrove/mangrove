import "./index.css"
import { ErrorBoundary, Match, Switch, render } from "solid-js/web"
import { LoginPage, RecoverPage, SettingsPage, initWs, } from '../../../packages/ui/src'
import { Route, Router, Routes, useLocation } from "../../../packages/ui/src/core/dg"

function App() {
    return <Routes>
        <Route path="/embed/:ln/login" component={() => <LoginPage
            createAccount='/MBRR/iCore/Contacts/CreateAccount.aspx'
            recoverUser='http://localhost:8080/iParts/Contact%20Management/ContactSignIn/ContactSignInDialog.aspx?SendUsername=true&CK=7118bf41-8789-4cd5-bca8-d6a224a6cf2a&CIK=003a2bee-8d0c-487a-9f90-a9059724b070&WebsiteKey=e7590042-1672-4d0f-a20c-335e0bf62de2&ReturnUrl=%2fiCore%2fContacts%2fSign_In.aspx%3fLoginRedirect%3dtrue%26returnurl%3d%252fMBRR'
            recoverPassword='http://localhost:8080/iParts/Contact%20Management/ContactSignIn/ContactSignInDialog.aspx?SendPasswordReset=true&CK=7118bf41-8789-4cd5-bca8-d6a224a6cf2a&CIK=003a2bee-8d0c-487a-9f90-a9059724b070&WebsiteKey=e7590042-1672-4d0f-a20c-335e0bf62de2&ReturnUrl=%2fiCore%2fContacts%2fSign_In.aspx%3fLoginRedirect%3dtrue%26returnurl%3d%252fMBRR'
        />} />
        <Route path="/embed/:ln/settings" component={SettingsPage} />
        <Route path="*">
            <div>404 </div>
        </Route>
    </Routes>
}

let s = `ws://${window.location.host}/embed/wss`
s = "ws://localhost:8080/embed/wss"
initWs(s)
render(() => (<Router><App /></Router>), document.getElementById("app")!)

