
import { Route, Router, Routes, useNavigate } from "@solidjs/router"
import { Show, createSignal } from "solid-js"
import { Ab, Composer, H2, P } from "../../ui-solid/src"
import { tools } from "./tools";
import { LoginInfo, LoginProvider, loginApi, LoginConfig, RegisterPage, RegisterPage2, SimplePage, Login } from "../../login-solid/src";
import { LanguageProvider, useLn } from "../../i18n-solid/src/i18n_solid";
import { Peer, WsChannel } from "../../abc/src";
import { CreateFirst } from "./onboard"

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

    return 
       



}


// if they are already logged in they should go to the editor directly
// otherwise get the landing page.
export function LoginPage() {
    const ln = useLn()
      return  <SimplePage>
        <H2 class='mb-2'>{ln().signin}</H2>
        <P class='hidden mb-4'>{ln().welcomeback}</P>
        <Ab class='block mt-2 mb-3' href='..'>{ln().ifnew}</Ab>
        <Login  />
    </SimplePage>
}
function Onboard () {
    const nav = useNavigate()
    const ln = useLn()
    let peer: Peer = new Peer(new WsChannel(wss))
    const api = loginApi(peer)

    const o: LoginConfig = {
        api: api,
        setLogin: setLogin
    }
    return   <LoginProvider config={o} >
        <Routes>
        <Route path={`/:ln/login`} component={LoginPage} />
        <Route path={`/:ln/register`} component={RegisterPage} />
        <Route path={`/:ln/register2`} component={RegisterPage2} />
        <Route path="*" component={CreateFirst} />
    </Routes>
    </LoginProvider>
}


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