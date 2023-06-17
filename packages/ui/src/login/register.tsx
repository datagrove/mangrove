
// for imis we should try to intercept the registration and just steal the password if it succeeds.
// for 1199 we don't need registration at all; just a QR code for pat?
// how does pat grant then?

import { Component, JSX, Match, Switch, createSignal } from "solid-js"
import { createWs } from "../core/socket"
import { BlueButton, P, TextDivider } from "../lib/form"
import { AddPasskey, InputLabel, PasskeyChoice, email, password, phone, user } from "./passkey_add"
import { useLn } from "./passkey_i18n"

import { InputCell } from "../lib/input"
import { PasswordCell } from "./password"
import { SimplePage } from "./simplepage"
import { LoginWith } from "./login_with"
import { Ab, H2 } from "../layout/nav"

import * as bip39 from 'bip39'
import { useNavigate } from "@solidjs/router"
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
} from "@github/webauthn-json/browser-ponyfill";
import { login } from "../lib/crypto"
import { setCoreLogin } from "../core"

// as cell is like a lens, do we need both?
import { createCells } from "../db"

export type DivProps = JSX.HTMLAttributes<HTMLDivElement>
export function Error(props: DivProps) {
    return <div class='text-red-600 mt-2' {...props} >{props.children}</div>
}
const Bip39Field: Component<{ code: string }> = (props) => {
    return <div ><InputLabel>Recovery Code</InputLabel><textarea rows='2' autocomplete='new-password' name='password' id='bip39' class='w-full  p-2 dark:bg-neutral-800 bg-neutral-200 rounded-md border border-neutral-500 '>{props.code}</textarea></div>
}

export const RegisterPage = () => <SimplePage><Register /></SimplePage>

const Register = () => {
    const nav = useNavigate()
    const ws = createWs()
    const ln = useLn()
    // registration is a transaction, but then we later want to be able to edit 
    const data = createCells({
        name: "user",
        cells: {
            user: { ...user, autofocus: false },
            email: { ...email, autofocus: true },
            password: { ...password, autofocus: false },
        },
        primary: ["user"]
    })

    data.user.setValue("Anonymous")
    const [error, setError] = createSignal("")

    //const [okname, setOkname] = createSignal(false)
    const submit = async (ev: any) => {
        ev.preventDefault()
        const o = await ws.rpcj<any>("register", { name: data.user.value() })
        const cco = parseCreationOptionsFromJSON(o)
        const cred = await create(cco)
        const [token, err] = await ws.rpcje<any>("registerb", cred.toJSON())
        if (err) {
            setError(err)
        } else {
            setCoreLogin({ did: "" })
            nav('../home')
        }
    }


    return <Switch>

        <Match when={true}>

            <form method='post' class='space-y-6' onSubmit={submit} >
                <H2 class='mb-2'>{ln().register1}</H2>
                <P class='mb-4'>{ln().register2} </P>
                <InputCell cell={data.user} />
                <Error>{error()}</Error>

                <BlueButton autofocus >{ln().register}</BlueButton>
                <div class='mt-2'><Ab href='../register2'>{ln().recoverWithPhone}</Ab></div>
            </form></Match></Switch>

}
//     const mn = bip39.generateMnemonic()
//         <PasswordCell cell={data.password} />
//     data.password.setValue(mn)
//     <Bip39Field code={mn} />
export const RegisterPage2 = () => {
    const nav = useNavigate()
    const [error, setError] = createSignal("")
    const ws = createWs()
    const ln = useLn()
    // registration is a transaction, but then we later want to be able to edit 
    const data = createCells({
        name: "user",
        cells: {
            user: { ...user, autofocus: false },
            email: { ...email, autofocus: true },
            password: { ...password, autofocus: false },
        },
        primary: ["user"]
    })

    const [addkey, setAddKey] = createSignal(false)
    //const [okname, setOkname] = createSignal(false)
    const submitRegister = async () => {
        const [ok, e] = await ws.rpcje<boolean>("register2", {
            email: data.email.value(),
            password: data.password.value(),
        })
        // ok here, but we should have a way to submit the sheet and get back errors for everything.
        if (e) {
            setError(e)
        } else {
            setAddKey(true)
        }
    }

    function onCloseAddKey(u: PasskeyChoice, error: string): void {
        if (error) {
            setError(error)
        } else {
            nav('../home')
        }
    }
    return <SimplePage><Switch> <Match when={addkey()}><AddPasskey onClose={onCloseAddKey} /></Match>
        <Match when={true}>
            <form method='post' class='space-y-6' onSubmit={(e: any) => e.preventDefault()} >
                <H2 class='mb-2'>{ln().register3}</H2>
                <P class='mb-4'>{ln().register4} </P>
                <Error>{error()}</Error>
                <InputCell cell={data.email} />
                <PasswordCell cell={data.password} />
                <BlueButton onClick={() => submitRegister()} >{ln().register}</BlueButton>
                <TextDivider>{ln().continueWith}</TextDivider>
                <LoginWith />
            </form></Match></Switch></SimplePage>

}



// registration should allow the user to enter a username, but this doesn't need to be unique always. For some websites they will want to enforce uniqueness.
/*
        <Username ref={el!} onInput={(e: any) => setUser(e.target.value)} />
        <Show when={user()}><div>{user()} is {okname() ? "" : "not"} available</div></Show>
        <Password onInput={(e: any) => setPassword(e.target.value)} />


    const [okname, setOkname] = createSignal(false)
        if (register()) {
            // we need to check if the name is available
            const [ok, e] = await ws.rpcje<boolean>("okname", { name: u })
            if (!e && ok) {
                setOkname(true)
            } else {
                setOkname(false)
            }
        }
                    <Match when={screen() == Screen.Register}>
                        <form method='post' class='space-y-6' onSubmit={(e:any)=>e.preventDefault()} >
                            <Username ref={el!} onInput={(e: any) => setUser(e.target.value)} />
                            <Show when={user()}><div>{user()} is {okname() ? "" : "not"} available</div></Show>
                            <Password onInput={(e: any) => setPassword(e.target.value)} />
                            <BlueButton disabled={register() && !okname()} >{ln().register}</BlueButton>
                        </form>


                    </Match>
export function Register() {

    // registration is a transaction, but then we later want to be able to edit 
    const data = {
        user: cell(),
        password: cell(),
    }

    const submitRegister = async (e: any) => {
        e.preventDefault()
        if (register()) {
            const [log, e] = await ws.rpcje<LoginInfo>("createuser", { username: user(), password: password() })
            if (e) {
                setError(e)
                return
            }
            setLoginInfo(loginInfo)
            // ask for second factor here.
            abortController.abort()
            setScreen(Screen.AddKey)
        }
    }



    return <Page>
        <Title />
        <Body>
        <form method='post' class='space-y-6' onSubmit={submitRegister} >
        <Username ref={el!} onInput={(e: any) => setUser(e.target.value)} />
        <Show when={user()}><div>{user()} is {okname() ? "" : "not"} available</div></Show>
        <Password onInput={(e: any) => setPassword(e.target.value)} />
        <BlueButton disabled={register() && !okname()} >{ln().register}</BlueButton>
        </form>
        </Body>
    </Page>
}
*/
