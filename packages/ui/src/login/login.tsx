import { Route, Router, Routes, useNavigate } from "@solidjs/router";
import { effect, render } from "solid-js/web";

import { Body, Center, Page, Title } from "..";
import { Component, Show, createSignal, getListener } from "solid-js";
import { useLn } from "./passkey_i18n";
import { DarkButton } from "../layout/site_menu";
import { LanguageSelect } from "../layout/i18";
import { BlueButton } from "../lib/form";
import { AddPasskey, GetSecret, Input, getLoginChoice, loginChoice } from "./passkey_add";




const [factor, setFactor_] = createSignal(localStorage.getItem("factor") || "passkey")
const setFactor = (x: string) => {
    localStorage.setItem("factor", x)
    setFactor_(x)
}





const InputLabel = (props: any) => {
    return <label {...props} class="dark:text-neutral-400 text-neutral-600 block text-sm font-medium leading-6">{props.children}</label>
}
const Username: Component<{}> = (props) => {
    const ln = useLn()

    return <div >
        <div class="flex items-center justify-between">
            <InputLabel for="username" >{ln().username}</InputLabel>
        </div>
        <div class="mt-2">
            <Input  {...props} placeholder={ln().enterUsername} autofocus id="username" name="username" type="text" autocomplete="username webauthn" class="block w-full rounded-md border-0 dark:bg-neutral-900 bg-neutral-100 py-1.5  shadow-sm ring-1 ring-inset dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
        </div>
    </div>
}


const Password: Component = (props) => {
    const ln = useLn()
    const [hide, setHide] = createSignal(false)
    let el: HTMLInputElement

    const toggle = (e: any) => {
        e.preventDefault()
        setHide(!hide())
        if (!hide()) {
            el.type = 'text';
        } else {
            el.type = 'password';
        }
    }

    return <div>
        <div class="flex items-center justify-between">
            <InputLabel for="password" >{ln().password}</InputLabel>
            <div class="text-sm">
                <button onClick={toggle} class="font-semibold hover:underline text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">{hide() ? ln().show : ln().hide} {ln().password}</button>
            </div>
        </div>
        <div class="mt-2">
            <Input ref={el!} id="password" name="password" type={hide() ? "password" : "text"} autocomplete="current-password" required />
        </div>
    </div>
}


export const LoginPage: Component<{}> = (props) => {
    const ln = useLn()
    const [open, setOpen] = createSignal(false)
    const [getSecret, setGetSecret] = createSignal(false)
    getLoginChoice()
    const submit = (e: any) => {
        e.preventDefault()
        if (loginChoice()?.factor == "") {
            setOpen(true)// we need to add a passkey
        } else {
            setGetSecret(true)
        }
    }
    const onChange = (e: any) => {
        setOpen(false)
    }
    const confirmSecret = (ok: boolean) => {
        setGetSecret(false)
    }
    return <>
        <AddPasskey when={open} onChange={onChange} /><div dir={ln().dir}>
            <GetSecret when={getSecret()} onChange={confirmSecret} />
            <div class='fixed w-screen flex flex-row items-center pr-4'>
                <div class='flex-1' />
                <div class='w-48'><LanguageSelect /></div>
                <DarkButton /></div>
            <Center>
                <Show when={!open() && !getSecret()}>
                    <form class='space-y-6' onSubmit={submit} >
                        <Username />
                        <Password />
                        <BlueButton disabled={loginChoice() == null} >{ln().signin}</BlueButton>
                    </form></Show>
            </Center>
        </div></>
}

function Register() {
    return <Page>
        <Title />
        <Body>Register</Body>
    </Page>
}

