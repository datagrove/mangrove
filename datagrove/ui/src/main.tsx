import "./index.css"
import { render } from "solid-js/web"
import { initWs, } from '../../../packages/ui/src'
import { Router } from "../../../packages/ui/src/core/dg"
import { App } from "./app"
import { createSignal } from "solid-js"

const messageChannel = new MessageChannel();

const [swr,setSwr] = createSignal<ServiceWorkerRegistration|undefined>(undefined)

navigator.serviceWorker.register("/sw.js");
navigator.serviceWorker.ready.then((registration) => {
    async function fetch(url: string) : Promise<Blob>{
        return new Blob(['hello from leader'], {type : 'text/plain'})
    }
    
    console.log ("service worker ready")
    setSwr(registration)
    messageChannel.port1.onmessage = async (event) => {
        // basically the only thing we need is to help the service worker fetch. it needs to be async though.
        const { method, id, params } = event.data;
        switch(method) {
        case 'fetch':
            console.log("fetching", params)
            let r = await fetch(params)
            messageChannel.port2.postMessage( { id, result: r } )
            break
        }
    }
    navigator.serviceWorker.controller?.postMessage({
        method: 'connect',
        params: messageChannel.port2,
    });
    console.log("service worker initialized")
})



async function doFetch() {
let a = await fetch("/test")
let b = await a.text()
    console.log("Response:", b);
}


let s = `ws://${window.location.host}/wss`
s = `ws://localhost:3000/wss`
initWs(s)
render(() => (<Router><App /></Router>), document.getElementById("app")!)