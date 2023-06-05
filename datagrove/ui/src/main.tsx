import "./index.css"
import { render } from "solid-js/web"
import { initWs, } from '../../../packages/ui/src'
import { Router } from "../../../packages/ui/src/core/dg"
import { App } from "./app"
import { createSignal } from "solid-js"


function swr() {
    const [swr,setSwr] = createSignal<ServiceWorkerRegistration|undefined>(undefined)

    // we should be able to tell if we are the leader from the service worker?
    console.log("registering service worker")
    self.addEventListener('message', (event) => {
        console.log("message", event.data)
    })

    navigator.serviceWorker.ready.then((registration:any) => {
        setSwr(registration)
        //testSwr()
    })

    const badRegister = () => {
        async function fetchx(url: string) : Promise<Blob>{
            return new Blob(['hello from leader'], {type : 'text/plain'})
        }
        
        console.log ("service worker ready")


        const messageChannel = new MessageChannel();
        navigator.serviceWorker.controller?.postMessage(
        {
            type: 'INIT_PORT',
        },
        [messageChannel.port2],
        );
        messageChannel.port1.addEventListener('message', (event) => {
            // basically the only thing we need is to help the service worker fetch. it needs to be async though.
            const { method, id, params } = event.data;
            switch(method) {
            case 'log':
                console.log.apply(null, params)
                break
            case 'fetch':
                console.log("fetching", params)
                fetchx(params).then((r) => {
                    console.log("fetch result", r)
                    navigator.serviceWorker.controller?.postMessage( { id, result: r } )
                })
                break
            }
        })

        console.log("service worker initialized")
        

    }
    navigator.serviceWorker.register("/sw.js");
}
async function testSwr() {
    console.log("%c testing service worker", "color: red")
    const r = await fetch("/~/test")
    const t = await r.text()
    console.log("%c test fetch "+t, "color: red")
}
// window.addEventListener('beforeunload', (event) => {
//     event.returnValue = `Are you sure you want to leave?`;
//   });

let s = `ws://${window.location.host}/wss`
s = `ws://localhost:3000/wss`
initWs(s)
render(() => (<Router><App /></Router>), document.getElementById("app")!)