
import { Router } from "@solidjs/router"
import { Show, createSignal } from "solid-js"
import { Composer } from "../../ui-solid/src"
import { tools } from "./tools";
import { LoginInfo, LoginOrRegister, LoginProvider, loginApi, LoginConfig } from "../../login-solid/src";
import { LanguageProvider, useLn } from "../../i18n-solid/src/i18n_solid";
import { Peer, WsChannel } from "../../abc/src";
import { Onboard } from "../../onboard-solid/src"

const [login, setLogin] = createSignal<LoginInfo | undefined>()

function init() {
    const o = JSON.parse(localStorage.login)
    if (false) {
        setLogin(o as LoginInfo)
    }
}
init()
export function CustomEditor() {
    return <div><Composer tools={tools()} /></div>
}

const wss = "ws://localhost:8080/ws"

const Signup = () => {
    const ln = useLn()
    let peer: Peer = new Peer(new WsChannel(wss))
    const api = loginApi(peer)

    const o: LoginConfig = {
        api: api,
        setLogin: setLogin
    }

    return <Show when={ln()}><LoginProvider config={o} >
        <LoginOrRegister />
    </LoginProvider></Show>
}


// if they are already logged in they should go to the editor directly
// otherwise get the landing page.




export function EditorApp() {
    return <Router>
        <LanguageProvider>
         <Show when={login()} fallback={<Onboard/>}>
            <CustomEditor/>
            </Show>      
         </LanguageProvider>
    </Router>
}

/*
        
            
       
           
                <Routes>
                    <WTF/>
                </Routes>
            
<Show when={login()} fallback={<Signup />}  >
<Routes>
    <Route path="*" component={CustomEditor} />
</Routes>
</Show>
*/


// window.addEventListener('beforeunload', (event) => {
//     event.returnValue = `Are you sure you want to leave?`;
//   });

// let s = `ws://${window.location.host}/wss`
// s = `ws://localhost:3000/wss`
// initWs(s)