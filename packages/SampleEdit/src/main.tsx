
import { Router } from "@solidjs/router"
import { Datagrove } from "../../datagrove/src"
import { Show, createSignal } from "solid-js"
import { Route, Routes, useNavigate } from "@solidjs/router";
import { Composer } from "../../ui-solid/src"
import { tools } from "./tools";
import { ChallengeNotify, LoginApi, Login, LoginInfo, LoginOrRegister, LoginProvider, loginApi, LoginConfig } from "../../login-solid/src";
import { LanguageProvider, useLn } from "../../i18n-solid/src/i18n_solid";
import { Peer, WsChannel } from "../../abc/src";


const [login, setLogin] = createSignal<LoginInfo|undefined>()

export function CustomEditor() {
    return <div><Composer tools={tools()}/></div>
}

const wss = "ws://localhost:8080/ws"

const Signup = () => {
    const ln = useLn()
    let peer : Peer = new Peer(new WsChannel(wss))
    const api = loginApi(peer)    
    
    const o : LoginConfig = {
        api: api,
        setLogin: setLogin
    }

    return <Show when={ln()}><LoginProvider config={o} >
        <LoginOrRegister  />
    </LoginProvider></Show>
}


// do I want Datagrove to rely on the router? what's a better way to do this?
export function EditorApp() {
    return <Router>
        <LanguageProvider>
        <Datagrove>
        <Show when={login()} fallback={<Signup/>}  >
            <Routes>
                <Route path="*" component={CustomEditor} />
            </Routes>
          </Show>
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