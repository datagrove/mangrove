import { Component, createSignal, Switch, Match } from "solid-js"
import { createWs } from "../core/socket"
import { BlueButton } from "../lib/form"

import { PhoneInput, EmailInput, Username, Password } from "./passkey_add"
import { useLn } from "./passkey_i18n"
import { SimplePage } from "../layout/nav"

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

    const [user, setUser] = createSignal("")
    const [password, setPassword] = createSignal("")
    const [email, setEmail] = createSignal("")
    const [phone, setPhone] = createSignal("")
    const [secret, setSecret] = createSignal("")

    const submit = (e: Event) => {
        e.preventDefault()
    }

    const recover = async () => {
        const o = await ws.rpcj("recover", { email: email(), phone: phone() })
        setScreen(RecoverScreen.Recover2)
    }
    const recover2 = async () => {
        const o = await ws.rpcj("recover2", { secret: secret() })
        setScreen(RecoverScreen.Recover2)
    }

    return <Switch>
        <Match when={screen() == RecoverScreen.Recover}>
        <form method='post' class='space-y-6' onSubmit={submit} >
            <div>Enter phone or email</div>
            <PhoneInput autofocus onInput={setPhone} />
            <EmailInput onInput={setEmail} />
            <BlueButton onClick={recover} >{ln().recover}</BlueButton>
        </form>
    </Match>
    <Match when={screen() == RecoverScreen.Recover2}>
        <form method='post' class='space-y-6' onSubmit={submit} >
            <div>Choose a new password </div>
            <Username onInput={setUser}></Username>
            <Password onInput={setPassword} />
            <BlueButton onClick={recover2} >{ln().recover}</BlueButton>
        </form>
    </Match>
    <Match when={true}>
        <div>Bad screen {screen()} </div>
    </Match></Switch>
}
