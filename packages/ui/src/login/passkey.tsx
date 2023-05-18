import { Component, Match, Show, Switch, createSignal } from "solid-js"
import { Ab } from "../layout/nav"
import { BlueButton } from "../lib/form"
import { generatePassPhrase, security } from "../lib/crypto"
import {
    get,
    parseRequestOptionsFromJSON,
} from "@github/webauthn-json/browser-ponyfill";

import { createWs } from "../core/socket"
import { useLn } from "./passkey_i18n"
import { useNavigate } from "../core/dg";
import { LoginInfo } from "./passkey_add";
import { SimplePage } from "./simplepage";

const [crox, setCrox] = createSignal<any>(null)
// this blocks a promise waiting for the user to offer a passkey
export let abortController: AbortController

//if password is empty, then this is for a new
// const register = async (user: string, password: string) => {
//     const ws = createWs()
//     const o = await ws.rpcj<any>("register", {
//         device: user() // sec.deviceDid
//     })
//     const cco = parseCreationOptionsFromJSON(o)
//     const cred = await create(cco)
//     const token = await ws.rpcj<any>("register2", cred.toJSON())
//     setLogin(token)
// }


// not a conditional mediation, this will force a dalog.
export const webauthnLogin = async () => { // id: string, not needed?
    abortController.abort()
    const ws = createWs()
    // LOGIN
    // const o2 = await ws.rpcj<any>("loginx", {
    //     device: id,
    //     //username: sec.userDid // maybe empty
    // })
    // const cro = parseRequestOptionsFromJSON(o2)
    const o = await get(crox())
    const reg = await ws.rpcj<LoginInfo>("login2", o.toJSON())
    return reg
    //setLogin(reg)
    // instead of navigate we need get the site first
    // then we can navigate in it. the site might tell us the first url

}


// returns null if the login is aborted
export async function initPasskey(): Promise<LoginInfo | null> {
    if (!window.PublicKeyCredential
        // @ts-ignore
        || !PublicKeyCredential.isConditionalMediationAvailable
        // @ts-ignore
        || !await PublicKeyCredential.isConditionalMediationAvailable()
    ) {
        return null
    }
    if (abortController) {
        abortController.abort()
    }
    abortController = new AbortController()
    const ws = createWs()
    const sec = security()

    // if we loop here, do we need to do first  part twice
    // this will return nil if the user is not registered?
    // that doesn't seem right
    {
        try {
            const o2 = await ws.rpcj<any>("login", {
                device: sec.deviceDid,
            })

            const cro = parseRequestOptionsFromJSON(o2)
            setCrox(cro)
            console.log("waiting for sign")
            const o = await get({
                publicKey: cro.publicKey,
                signal: abortController.signal,
                // @ts-ignore
                mediation: 'conditional'
            })
            console.log("got sign")
            if (abortController.signal.aborted) {
                console.log("aborted")
                return null
            }


            // token is not the socket challenge, it can be shared across tabs.
            // we need to get back the site store here, does it also keep a token?
            // we will eventually write the store into opfs
            // rejected if the key is not registered. loop back then to get another?
            return await ws.rpcj<LoginInfo>("login2", o.toJSON())
        } catch (e: any) {
            // don't show error here, we probably just aborted the signal
            console.log("error", e)
        }
    }
    // instead of navigate we need get the site first
    // then we can navigate in it. the site might tell us the first url
    return null
}


const defaultLogin = {
    passkeyOnly: true,
    password: false
}
type LoginPolicy = typeof defaultLogin

const [policy, setPolicy] = createSignal(defaultLogin)


export const Register = () => {
    const ws = createWs()
    const [user, setUser] = createSignal("")
    const ln = useLn()

    // passkeys are portable so this can be a user id? random though? numeric?
    // the problem with not having a name here is that name is how passkey tracks the key
    // so we really need to get a name, even if we don't use it

    const submit = (e: Event) => {
        e.preventDefault()
        //register()
    }

    return <SimplePage>
        <form onSubmit={submit}>
            <div class='space-y-6'>
                <Username onInput={setUser} />
                <BlueButton disabled={!user()} >{ln().register}</BlueButton>
            </div>
        </form>
    </SimplePage>
}



export const LoginPasskey: Component<{ login?: boolean }> = (props) => {
    const ln = useLn()

    const ws = createWs()
    const nav = useNavigate()
    const [user, setUser] = createSignal("")
    const [error, setError] = createSignal("")

    const [bip39, setBip39] = createSignal(false)

    initPasskey().then((ok) => {

    })


    // this is for a bip39 option
    const [mn, setMn] = createSignal(generatePassPhrase())
    const generate = (e: any) => {
        e.preventDefault()
        setMn(generatePassPhrase())
    }


    const signin = async (e: SubmitEvent) => {
        e.preventDefault()
        //await webAuthnLogin(username())
    }

    return <SimplePage>
        <form onSubmit={signin} class="space-y-6 mt-4" action="#" method="post">
            <Switch>
                <Match when={policy().passkeyOnly}>
                    <PasskeyOnly />
                    <Show when={!props.login}>

                    </Show>
                </Match>
                <Match when={true}>
                    <Username onInput={setUser} />

                    <Show when={policy().password}>
                        <Password /></Show>

                    <div class='mt-4'>
                        <BlueButton onClick={() => { }}>{props.login ? ln().signin : ln().register}</BlueButton>
                    </div>
                </Match>
            </Switch>
        </form>

        <div class='flex w-full mt-4'><div class='flex-1' /> <Ab href={`/${"en"}/register`}>{ln().register}</Ab><div class='flex-1' /> </div>
    </SimplePage>

}

// make this look like a button?
export const PasskeyOnly = () => {
    const ln = useLn()
    return <div class="mt-2">
        <input placeholder={ln().enterPasskey} autofocus id="username" name="username" type="text" autocomplete="username webauthn" class="block w-full rounded-md border-0 dark:bg-neutral-900 bg-neutral-100 py-1.5  shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
    </div>
}
const Username: Component<{ generate?: boolean, onInput: (s: string) => void }> = (props) => {
    const ln = useLn()
    const ws = createWs()

    const inp = (e: InputEvent) => {
        props.onInput((e.target as HTMLInputElement).value)
        console.log("username", (e.target as HTMLInputElement).value)
    }
    return <div >
        <div class="flex items-center justify-between">
            <label for="username" class="dark:text-neutral-400 text-neutral-600 block text-sm font-medium leading-6">{ln().username}</label>
        </div>
        <div class="mt-2">
            <input onInput={inp} placeholder={ln().enterUsername} autofocus id="username" name="username" type="text" autocomplete="username webauthn" class="block w-full rounded-md border-0 dark:bg-neutral-900 bg-neutral-100 py-1.5  shadow-sm ring-1 ring-inset dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
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
            <label for="password" class="block text-sm font-medium leading-6 text-white">{ln().password}</label>
            <div class="text-sm">
                <button onClick={toggle} class="font-semibold text-indigo-400 hover:text-indigo-300">{hide() ? ln().show : ln().hide} {ln().password}</button>
            </div>
        </div>
        <div class="mt-2">
            <input ref={el!} id="password" name="password" type={hide() ? "password" : "text"} autocomplete="current-password" required class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
        </div>
    </div>
}



// class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
//<label for="username" class="block text-sm font-medium leading-6 text-white">Email address</label>


/*
    const signin2 = async (e: SubmitEvent) => {
        e.preventDefault()
        if (bip39()) {
            createUser(mn(), true)
            await webauth()
        } else {
            const w = window as any
            if (w.PasswordCredential) {
                // @ts-ignore
                var c = await navigator.credentials.create({ password: e.target });
                await navigator.credentials.store(c!);
                createUser(el!.value, true)
                await webauth()
            }
        }
        nav("/")
    }

            <Show when={bip39()}>

                <div >

                    <div class="flex items-center justify-between">
                        <label for="password" class="block text-sm font-medium leading-6 text-white">BIP39 phrase</label>
                        <div class="text-sm">
                            <button onClick={generate} class="font-semibold text-indigo-400 hover:text-indigo-300">Generate</button>
                        </div>
                    </div>
                    <textarea rows='2' id='bip39' class='w-full my-2 p-2 bg-white rounded-md border border-neutral-500 dark:text-black'>{mn()}</textarea>

                </div>
            </Show>
            */