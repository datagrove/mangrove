import "./index.css"
import { render } from "solid-js/web"
import { LoginPage, SettingsPage, initWs, } from '../../../packages/ui/src'
import { Route, Router, Routes } from "../../../packages/ui/src/core/dg"

const prefix = "/auth"
function Login() {
    return <LoginPage
            createAccount='/MBRR/iCore/Contacts/CreateAccount.aspx'
            recoverUser='/iParts/Contact%20Management/ContactSignIn/ContactSignInDialog.aspx?SendUsername=true&CK=7118bf41-8789-4cd5-bca8-d6a224a6cf2a&CIK=003a2bee-8d0c-487a-9f90-a9059724b070&WebsiteKey=e7590042-1672-4d0f-a20c-335e0bf62de2&ReturnUrl=%2fiCore%2fContacts%2fSign_In.aspx%3fLoginRedirect%3dtrue%26returnurl%3d%252fMBRR'
            recoverPassword='/iParts/Contact%20Management/ContactSignIn/ContactSignInDialog.aspx?SendPasswordReset=true&CK=7118bf41-8789-4cd5-bca8-d6a224a6cf2a&CIK=003a2bee-8d0c-487a-9f90-a9059724b070&WebsiteKey=e7590042-1672-4d0f-a20c-335e0bf62de2&ReturnUrl=%2fiCore%2fContacts%2fSign_In.aspx%3fLoginRedirect%3dtrue%26returnurl%3d%252fMBRR'
        />
}

function App() {
    //return <div>{`${prefix}/:ln/login`}</div>
    return <Routes>
        <Route path={`${prefix}/:ln/login`} component={Login} />
        <Route path={`${prefix}/:ln/settings`} component={SettingsPage} />
        <Route path="*">
            <div>404 </div>
        </Route>
    </Routes>
}

let s = `ws://${window.location.host}${prefix}/wss`
s = `ws://localhost:3000/wss`
initWs(s)
render(() => (<Router><App /></Router>), document.getElementById("app")!)

