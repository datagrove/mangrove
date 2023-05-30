import "./index.css"
import { render } from "solid-js/web"
import { initWs, } from '../../../packages/ui/src'
import { Router } from "../../../packages/ui/src/core/dg"
import { App } from "./app"

let s = `ws://${window.location.host}/wss`
s = `ws://localhost:3000/wss`
initWs(s)
render(() => (<Router><App /></Router>), document.getElementById("app")!)