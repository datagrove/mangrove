import { Component, JSX, JSXElement, Match, Switch, createEffect, createSignal, onCleanup } from "solid-js"


export * from '@solidjs/router'


export function hashPath(s: string) { return s}

export const [ln, setLn_] = createSignal("en")
export const loc = () => window.location.hash.slice(1)

export const setLn = (s: string) => {
    setLn_(s)
    
}