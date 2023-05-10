import { Component, JSX, JSXElement, Match, Switch, createEffect, createSignal, onCleanup } from "solid-js"
import { useNavigate } from "@solidjs/router"


export * from '@solidjs/router'


//export function hashPath(s: string) { return s}

//export const [ln, setLn_] = createSignal("en")
export const loc = () => {
    const p = window.location.pathname
    return p
}
export const ln = () => {
    
   const p =    window.location.pathname.split('/')
   console.log("ln", p)
   return p[2]
}
