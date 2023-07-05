import { Component, createSignal, Switch, Match } from "solid-js"
import { createWs } from "../core/socket"
import { BlueButton } from "../lib/form"

import { DirectiveText, email, password, phone, user } from "./passkey_add"
import { useLn } from "../../i18n/src/i18n"


import { InputCell } from "../lib/input"
import { SimplePage } from "./simplepage"
import { createCells } from "../db"

enum RecoverScreen {
    Recover,
    Recover2,
}
export const RecoverPage = () => <SimplePage><Recover /></SimplePage>
// how should we get the user's info for recovery?
// there is no specific way, we could log in as a super user and get/set their info
// or we could create an api for it.
export const Recover: Component = (props) => {
    const ws = createWs()
    const ln = useLn()
    const [screen,setScreen] = createSignal(RecoverScreen.Recover)
    const [error, setError_] = createSignal("")

    const data = createCells({
        name: "recover",
        primary: [],
        cells: {
            user: user,
            password: password,
            email: email,
            phone: phone,
        }})
    

    const submit = (e: Event) => {
        e.preventDefault()
    }

    const recover = async () => {
        const o = await ws.rpcj("recover", { email: data.email.value(), phone: data.phone.value() })
        setScreen(RecoverScreen.Recover2)
    }
    const recover2 = async () => {
        const o = await ws.rpcj("recover2", { secret: data.password.value() })
        setScreen(RecoverScreen.Recover2)
    }

    return <Switch>
        <Match when={screen() == RecoverScreen.Recover}>
        <form method='post' class='space-y-6' onSubmit={submit} >
            <DirectiveText>Enter phone or email</DirectiveText>
            <InputCell autofocus cell={{...data.phone}} />
            <InputCell cell = {data.email }/>
            <BlueButton onClick={recover} >{ln.recover}</BlueButton>
        </form>
    </Match>
    <Match when={screen() == RecoverScreen.Recover2}>
        <form method='post' class='space-y-6' onSubmit={submit} >
            <div>Choose a new password </div>
            <InputCell autofocus cell={{...data.phone}} />
            <InputCell cell = {data.email }/>
            <BlueButton onClick={recover2} >{ln.recover}</BlueButton>
        </form>
    </Match>
    <Match when={true}>
        <div>Bad screen {screen()} </div>
    </Match></Switch>
}
