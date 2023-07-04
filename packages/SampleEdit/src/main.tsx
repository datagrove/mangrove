import "./index.css"
import { Router } from "@solidjs/router"
import { Datagrove, useDg } from "../../datagrove/src"


import { Show, createSignal } from "solid-js"
//import { getUser, login } from "../../../packages/ui/src/core"
import { Route, Routes, useNavigate } from "@solidjs/router";
import { SampleEditor } from "../../ui/src"

const [login, setLogin] = createSignal(true)


export function App() {
    const nav = useNavigate()
    const dg = useDg()
    
    const Signup = () => {
        return <div>Login!</div>
    }

    return <Show when={login()} fallback={<Signup/>}  >
            <Routes>
                <Route path="*" component={SampleEditor} />
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