import { LoginPage, RegisterPage, RegisterPage2, SettingsPage, LoggedIn, } from '../../../packages/ui/src'
import { Route, Routes, useNavigate } from "../../../packages/ui/src/core/dg"
import { Show, createEffect } from "solid-js"
import { createResource } from "solid-js";
import { getUser, login } from "../../../packages/ui/src/core"

const LoginRoutes = () => {
    const nav = useNavigate()
    return <Routes>
        <Route path={`/:ln/login`} component={LoginPage} />
        <Route path={`/:ln/login`} component={LoginPage} />
        <Route path={`/:ln/settings`} component={SettingsPage} />
        <Route path={`/:ln/register`} component={RegisterPage} />
        <Route path={`/:ln/register2`} component={RegisterPage2} />
        <Route path="*" component={() => {
            nav("/en/login")
            return <></>
        }} />
    </Routes>
}

export function App() {
    const nav = useNavigate()

    createEffect(() => {
        if (!login()) {
            nav("/en/login")
            console.log("redirecting to login")
        } else {
            getUser(login()!.did)
        }
    })

    return <Show when={login()} fallback={LoginRoutes()} >
        <Routes>
            <Route path="/:ln/:app/*" component={LoggedIn} />
            <Route path="*" component={LoggedIn} />
        </Routes>
    </Show>
}