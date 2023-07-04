import { Route, Routes, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { LoginPage } from "./login";
import { SettingsPage } from "./settings";
import { RegisterPage, RegisterPage2 } from "./register";


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