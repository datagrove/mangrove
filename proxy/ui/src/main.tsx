import "./index.css"
import { ErrorBoundary, Match, Switch, render } from "solid-js/web"
import { LoginPage, RecoverPage, SettingsPage, initWs,  } from '../../../packages/ui/src'
import { DefaultRoute, Route, Router, Routes, useLocation } from "../../../packages/ui/src/core/dg"

function App() {
    let s = `ws://${window.location.host}/embed/wss`
    s = "ws://localhost:8080/embed/wss"
    initWs(s)
    const loc = useLocation()


    return <Router><div>
        <ErrorBoundary fallback={(e) => <div>{e.message}</div>}>
            <Routes>
                <Route path="/" component={()=><LoginPage 
                createAccount='/MBRR/iCore/Contacts/CreateAccount.aspx'
                recoverUser='/iParts/Contact%20Management/ContactSignIn/ContactSignInDialog.aspx?SendUsername=true&CK=7118bf41-8789-4cd5-bca8-d6a224a6cf2a&CIK=003a2bee-8d0c-487a-9f90-a9059724b070&WebsiteKey=e7590042-1672-4d0f-a20c-335e0bf62de2&ReturnUrl=%2fiCore%2fContacts%2fSign_In.aspx%3fLoginRedirect%3dtrue%26returnurl%3d%252fMBRR'
                recoverPassword='/iParts/Contact%20Management/ContactSignIn/ContactSignInDialog.aspx?SendPasswordReset=true&CK=7118bf41-8789-4cd5-bca8-d6a224a6cf2a&CIK=003a2bee-8d0c-487a-9f90-a9059724b070&WebsiteKey=e7590042-1672-4d0f-a20c-335e0bf62de2&ReturnUrl=%2fiCore%2fContacts%2fSign_In.aspx%3fLoginRedirect%3dtrue%26returnurl%3d%252fMBRR'
                />} />
                <Route path="/recover" component={RecoverPage} />
                <Route path="/settings" component={SettingsPage} />
                <DefaultRoute>
                    <div>404 "{JSON.stringify(loc())}"</div>
                </DefaultRoute>
            </Routes>
        </ErrorBoundary>

    </div></Router>
}
render(() => (<App />), document.getElementById("app")!)

