
import { Router } from "@solidjs/router"
import { Datagrove } from "../../datagrove/src"
import { Show, createSignal } from "solid-js"
import { Route, Routes, useNavigate } from "@solidjs/router";
import { Composer } from "../../ui-solid/src"
import { tools } from "./tools";
import { ChallengeNotify, LoginApi, Login, LoginInfo, LoginOrRegister, LoginProvider, loginApi } from "../../login-solid/src";
import { LanguageProvider } from "../../i18n-solid/src";
import { Peer, WsChannel } from "packages/abc/src";


const [login, setLogin] = createSignal(false)

export function CustomEditor() {
    return <div><Composer tools={tools()}/></div>
}


export function App() {
    let peer : Peer = new Peer(new WsChannel("ws://localhost:3000/wss"))
    const api = loginApi(peer)
    
    const Signup = () => {
        return <LoginProvider api={api} setLogin={setLogin}>
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