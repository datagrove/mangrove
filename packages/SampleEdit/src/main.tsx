
import { Router } from "@solidjs/router"
import { Datagrove } from "../../datagrove/src"
import { Show, createSignal } from "solid-js"
//import { getUser, login } from "../../../packages/ui/src/core"
import { Route, Routes, useNavigate } from "@solidjs/router";
import { Composer } from "../../ui-solid/src"
import { tools } from "./tools";
import { IdentityServerApi, LoginPage } from "../../login-solid/src";
import { ChallengeNotify, LoginInfo } from "../../login-solid/src/passkey_add";

const [login, setLogin] = createSignal(false)

export function CustomEditor() {
    return <div><Composer tools={tools()}/></div>
}
const loginApi : IdentityServerApi = {
    loginpassword: function (user: string, password: string): Promise<[ChallengeNotify, string]> {
        throw new Error("Function not implemented.");
    },
    loginpassword2: function (secret: string): Promise<[LoginInfo, string]> {
        throw new Error("Function not implemented.");
    }
}

export function App() {
    const nav = useNavigate()
    
    const Signup = () => {
        return <LoginPage api={loginApi} setLogin={setLogin} />
    }

    return <Show when={login()} fallback={<Signup/>}  >
            <Routes>
                <Route path="*" component={CustomEditor} />
            </Routes>
          </Show>
}
    

// do I want Datagrove to rely on the router? what's a better way to do this?
export function EditorApp() {
    return <Router><Datagrove>
        <App />
        </Datagrove></Router>
}




// window.addEventListener('beforeunload', (event) => {
//     event.returnValue = `Are you sure you want to leave?`;
//   });

// let s = `ws://${window.location.host}/wss`
// s = `ws://localhost:3000/wss`
// initWs(s)