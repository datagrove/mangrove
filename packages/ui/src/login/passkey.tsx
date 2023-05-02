import { Component, JSXElement, Match, Show, Switch, createSignal } from "solid-js"
import { A } from "../layout/nav"
import { BlueButton, Center } from "../lib/form"
import { generatePassPhrase, security, setError, setLogin, setSecurity } from "../lib/crypto"
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
} from "@github/webauthn-json/browser-ponyfill";
import { DarkButton, SiteStore } from "../layout/site_menu"
import { createWs } from "../lib/socket"
import { useLn } from "./passkey_i18n"
import { LanguageSelect } from "../i18n/i18"
import { useNavigate } from "../core/dg";

// if password is empty, then this is for a new
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

// for transition; login with password before asking to add a passkey.
// not called if they login with a passkey (that's handled in initPasskey)
// any advantage here to a PAKE like OPAQUE?
const login = async (user: string, password: string) => {
    const ws = createWs()
    const o = await ws.rpcj<string>("bypassword", {
        user: user,
        password: password
    })
    return
}
// this blocks a promise waiting for the user to offer a passkey
export async function initPasskey(setError: (e: string) => void) {
    if (!window.PublicKeyCredential
        // @ts-ignore
        || !PublicKeyCredential.isConditionalMediationAvailable
        || !await PublicKeyCredential.isConditionalMediationAvailable()
    ) {
        return false
    }

    const ws = createWs()
    const abortController = new AbortController();
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

            console.log("waiting for sign")
            const o = await get({
                publicKey: cro.publicKey,
                signal: abortController.signal,
                // @ts-ignore
                mediation: 'conditional'
            })
            console.log("got sign")

            // token is not the socket challenge, it can be shared across tabs.
            // we need to get back the site store here, does it also keep a token?
            // we will eventually write the store into opfs
            // rejected if the key is not registered. loop back then to get another?
            const reg = await ws.rpcj<string>("login2", o.toJSON())
            setLogin("token")
            return true
        } catch (e: any) {
            setError(e.message)
        }
    }
    // instead of navigate we need get the site first
    // then we can navigate in it. the site might tell us the first url

}


const defaultLogin = {
    passkeyOnly: true,
    password: false
}
type LoginPolicy = typeof defaultLogin

const [policy, setPolicy] = createSignal(defaultLogin)

export const SimplePage: Component<{ children: JSXElement }> = (props) => {
    const ln = useLn()
    return <div dir={ln().dir}>
        <div class='flex flex-row items-center mr-4'>
            <div class='flex-1' />
            <div class='w-48'><LanguageSelect /></div>
            <DarkButton /></div>
        <Center>
            {props.children}
        </Center>
    </div>
}

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

// we only use this if browser supports webauthn but not passkey?
const webAuthnLogin = async (id: string) => {

    const ws = createWs()
    // LOGIN
    const o2 = await ws.rpcj<any>("loginx", {
        device: id,
        //username: sec.userDid // maybe empty
    })
    const cro = parseRequestOptionsFromJSON(o2)
    const o = await get(cro)
    const reg = await ws.rpcj<string>("loginx2", o.toJSON())
    setLogin(reg)
    // instead of navigate we need get the site first
    // then we can navigate in it. the site might tell us the first url

}


export const LoginPasskey: Component<{ login?: boolean }> = (props) => {
    const ln = useLn()

    const ws = createWs()
    const nav = useNavigate()
    const [user, setUser] = createSignal("")
    const [error, setError] = createSignal("")

    const [bip39, setBip39] = createSignal(false)

    initPasskey(setError).then((ok) => {

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

        <div class='flex w-full mt-4'><div class='flex-1' /> <A href={`/${"en"}/register`}>{ln().register}</A><div class='flex-1' /> </div>
    </SimplePage>

}

// make this look like a button?
export const PasskeyOnly = () => {
    const ln = useLn()
    return <div class="mt-2">
        <input placeholder={ln().enterPasskey} autofocus id="username" name="username" type="text" autocomplete="username webauthn" class="block w-full rounded-md border-0 dark:bg-neutral-900 bg-neutral-100 py-1.5  shadow-sm ring-1 ring-inset dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
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