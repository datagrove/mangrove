import { Component, Show, createSignal } from "solid-js"
import { key } from "solid-heroicons/solid"
import { A, Body, Page } from "../layout/nav"
import { BlueButton, Center, FieldSet, LightButton } from "../lib/form"
import { createUser, generatePassPhrase, security, setError, setLogin, setSecurity } from "../lib/crypto"
import { useNavigate, useParams } from "@solidjs/router"
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
} from "@github/webauthn-json/browser-ponyfill";
import { DarkButton, SiteStore } from "../layout/site_menu"
import { createWs } from "../lib/socket"
import { LanguageSelect } from "../layout/i18"
import Dismiss from "solid-dismiss"
import { Icon } from "solid-heroicons"

export const LoginPasskey = () => {
    return <Passkey login={true} />
}


// To abort a WebAuthn call, instantiate an `AbortController`.  


interface LoginPolicy {
    password: boolean

}
const [policy, setPolicy] = createSignal<LoginPolicy>({
    password: true
})

// interface Ln {
//     signin: string
//     register: string
//     addPasskey: string
//     notNow: string
//     notEver: string
// }
const en = {
    signin: "Sign in",
    register: "Create account",
    addPasskey1: "Would you like to add a passkey to your account?",
    addPasskey2: "Passkeys are safer than passwords and can be used to sign in to your account.",
    add: "Add",
    notNow: "Not now",
    notEver: "Not ever"
}
type Ln = typeof en
const es: Ln = {
    ...en,
    signin: "accceso",
    register: "Create account"
}
const iw: Ln = {
    ...en,
    signin: "התחברות",
    register: "Create account"
}
const allLn: { [key: string]: Ln } = {
    en,
    es,
    iw
}

type LnDir = () => "rtl" | "ltr"
type LnFn = () => Ln
export const useLn = (): [LnFn, LnDir] => {
    const p = useParams<{ ln: string }>();
    return [() => allLn[p.ln], () => p.ln == "iw" ? "rtl" : "ltr"]
}


export const Passkey: Component<{ login?: boolean }> = (props) => {
    const [ln, dir] = useLn()
    const abortController = new AbortController();
    const ws = createWs()
    const nav = useNavigate()

    const [bip39, setBip39] = createSignal(false)

    async function trylogin() {
        let isCMA = await PublicKeyCredential.isConditionalMediationAvailable();
        if (!isCMA) return
        const sec = security()
        // this will return nil if the user is not registered?
        // that doesn't seem right
        const o2 = await ws.rpcj<any>("login", {
            device: sec.deviceDid,
        })
        const cro = parseRequestOptionsFromJSON(o2)

        console.log("waiting for sign")
        const o = await get({
            publicKey: cro.publicKey,
            signal: abortController.signal,
            // @ts-ignore
            mediation: 'conditional'
        })
        console.log("got sign")

        const reg = await ws.rpcj<SiteStore>("login2", o.toJSON())
        setLogin(true)
        // instead of navigate we need get the site first
        // then we can navigate in it. the site might tell us the first url
        nav("/")
    }

    // try to log straight in.
    if (props.login
        && window.PublicKeyCredential
        // @ts-ignore
        && PublicKeyCredential.isConditionalMediationAvailable) {
        trylogin()
    }

    const [mn, setMn] = createSignal(generatePassPhrase())
    const generate = (e: any) => {
        e.preventDefault()
        setMn(generatePassPhrase())
    }
    const webauth = async () => {
        try {
            const sec = security()
            if (props.login) {
                // LOGIN
                const o2 = await ws.rpcj<any>("login", {
                    device: sec.deviceDid,
                    //username: sec.userDid // maybe empty
                })
                const cro = parseRequestOptionsFromJSON(o2)
                const o = await get(cro)
                const reg = await ws.rpcj<SiteStore>("login2", o.toJSON())
                setLogin(true)
                // instead of navigate we need get the site first
                // then we can navigate in it. the site might tell us the first url
                nav("/")
            } else {
                // REGISTRATION
                const o = await ws.rpcj<any>("register", {
                    device: sec.deviceDid
                })
                const cco = parseCreationOptionsFromJSON(o)
                const cred = await create(cco)
                const tempName = await ws.rpcj<any>("register2", cred.toJSON())
                if (tempName) {
                    setSecurity({
                        ...sec,
                        registered: true,
                    })
                    setLogin(true)
                    nav("/")
                } else {
                    setError("Registration failed")
                }
            }
        } catch (e: any) {
            setError(e)
        }
    }
    const signin = async (e: SubmitEvent) => {
        e.preventDefault()
        await webauth()
    }


    return <div dir={dir()}>
        <div class='flex flex-row items-center'>
            <div class='flex-1' />
            <div class='w-48'><LanguageSelect /></div>
            <div class='p-2'><DarkButton /></div></div>
        <Center>

            <form onSubmit={signin} class="space-y-6 mt-4" action="#" method="post">

                <Username generate={!props.login} />
                <Show when={policy().password}>
                    <Password /></Show>

                <div class='mt-4'>
                    <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">{ln().signin}</button>
                </div>
            </form>
            <Show when={props.login}>
                <div class='flex w-full mt-4'><div class='flex-1' /> <A href='/register'  >{ln().register}</A><div class='flex-1' /> </div>
            </Show>
            <Popup />
        </Center></div>

}

const Username: Component<{ generate?: boolean }> = (props) => {
    const ws = createWs()
    let el: HTMLInputElement

    const generate = () => {
        ws.rpcj<string>("username", {}).then((u) => {
            el.value = u
        })
    }
    return <div >
        <div class="flex items-center justify-between">
            <label for="username" class="block text-sm font-medium leading-6 text-white">User</label>
            <div class={`text-sm ${props.generate ? "" : "hidden"}`}>
                <button onClick={generate} class="font-semibold text-indigo-400 hover:text-indigo-300">Generate</button>
            </div>
        </div>
        <div class="mt-2">
            <input autofocus id="username" ref={el!} name="username" type="text" autocomplete="username webauthn" class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
        </div>
    </div>
}


const Password: Component = (props) => {
    let el: HTMLInputElement
    function togglePassword() {

    }
    const toggle = (e: any) => {
        e.preventDefault()
        if (el.type === 'password') {
            el.type = 'text';
        } else {
            el.type = 'password';
        }
    }

    const [hide, setHide] = createSignal(true)
    return <div>
        <div class="flex items-center justify-between">
            <label for="password" class="block text-sm font-medium leading-6 text-white">Password</label>
            <div class="text-sm">
                <button onClick={toggle} class="font-semibold text-indigo-400 hover:text-indigo-300">{hide() ? "Show" : "Hide"} password</button>
            </div>
        </div>
        <div class="mt-2">
            <input ref={el!} id="password" name="password" type={hide() ? "password" : "text"} autocomplete="current-password" required class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
        </div>
    </div>
}

export const Popup = () => {
    const [ln, dir] = useLn()
    const [open, setOpen] = createSignal(false);
    let btnEl;

    const add = () => { setOpen(false) }
    const notNow = () => { setOpen(false) }
    const notEver = () => { setOpen(false) }

    return <div>
        <button ref={btnEl}>Open</button>
        <div class='fixed z-50 top-0 left-0 w-screen h-screen'>
            <Dismiss


                menuButton={btnEl} open={open} setOpen={setOpen}>
                <div class="  mx-auto p-5 border w-96 shadow-lg rounded-md dark:bg-black bg-white">
                    <div class=" space-y-6 ">

                        <Icon path={key} class="w-24 h-24 mx-auto" />
                        <p >{ln().addPasskey1}</p>
                        <p class='text-neutral-500'>{ln().addPasskey2}</p>
                        <BlueButton onClick={add}>{ln().add}</BlueButton>
                        <LightButton onClick={notNow}>{ln().notNow}</LightButton>
                        <LightButton onClick={notEver}>{ln().notEver}</LightButton>

                    </div></div>
            </Dismiss></div>
    </div>
};

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