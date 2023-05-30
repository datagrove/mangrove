import { render } from "solid-js/web"
import { LoginPage, RegisterPage, RegisterPage2, SettingsPage, initWs, LoggedIn, } from '../../../packages/ui/src'
import { Route, Router, Routes, useLocation, useNavigate } from "../../../packages/ui/src/core/dg"
import { Show, createEffect } from "solid-js"
import { createResource } from "solid-js";
import { UserContext, getUser, login } from "../../../packages/ui/src/core"
import { createDatabase } from "../../../packages/ui/src/db"

const Main = () => {
    const [user] = createResource("1", getUser)
    return <Show when={user()}>
        <UserContext.Provider value={user()}>
            <LoggedIn />
        </UserContext.Provider>
    </Show>
}
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
    const [db] = createResource("1", createDatabase)
    createEffect(() => {
        if (!login()) {
            nav("/en/login")
            console.log("redirecting to login")
        }
    })

    return <Show when={login()} fallback={LoginRoutes()} >
        <Routes>
            <Route path="/:ln/:app/*" component={Main} />
            <Route path="*" component={Main} />
        </Routes>
    </Show>
}