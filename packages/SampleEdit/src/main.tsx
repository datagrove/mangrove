
import { Router } from "@solidjs/router"
import { Datagrove } from "../../datagrove/src"
import { Show, createSignal } from "solid-js"
import { Route, Routes, useNavigate } from "@solidjs/router";
import { Composer } from "../../ui-solid/src"
import { tools } from "./tools";
import { ChallengeNotify, LoginApi, Login, LoginInfo, LoginOrRegister, LoginProvider } from "../../login-solid/src";
import { LanguageProvider } from "../../i18n-solid/src";


const [login, setLogin] = createSignal(false)

export function CustomEditor() {
    return <div><Composer tools={tools()}/></div>
}
const loginApi : LoginApi = {
    loginpassword: function (user: string, password: string): Promise<[ChallengeNotify, string]> {
        throw new Error("Function not implemented.");
    },
    loginpassword2: function (secret: string): Promise<[LoginInfo, string]> {
        throw new Error("Function not implemented.");
    },
    register: function (name: string): Promise<any> {
        throw new Error("Function not implemented.");
    },
    registerb: function (cred: any): Promise<[string, string]> {
        throw new Error("Function not implemented.");
    },
    addpasskey: function (): Promise<any> {
        throw new Error("Function not implemented.");
    },
    addpasskey2: function (cred: any): Promise<[string, string]> {
        throw new Error("Function not implemented.");
    },
    login2: function (cred: any): Promise<LoginInfo> {
        throw new Error("Function not implemented.");
    },
    login: function (deviceId: string): Promise<any> {
        throw new Error("Function not implemented.");
    },
    recover: function (email: string, phone: string): Promise<void> {
        throw new Error("Function not implemented.");
    },
    recover2: function (otp: string): Promise<void> {
        throw new Error("Function not implemented.");
    }
}

export function App() {
    const Signup = () => {
        return <LoginProvider api={loginApi} setLogin={setLogin}>
            <LoginOrRegister  />
        </LoginProvider>
    }

    return <Show when={login()} fallback={<Signup/>}  >
            <Routes>
                <Route path="*" component={CustomEditor} />
            </Routes>
          </Show>
}
    

// do I want Datagrove to rely on the router? what's a better way to do this?
export function EditorApp() {
    return <Router>
        <LanguageProvider>
        <Datagrove>
        <App />
        </Datagrove>
        </LanguageProvider>
        </Router>
}




// window.addEventListener('beforeunload', (event) => {
//     event.returnValue = `Are you sure you want to leave?`;
//   });

// let s = `ws://${window.location.host}/wss`
// s = `ws://localhost:3000/wss`
// initWs(s)