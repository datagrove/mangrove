import { Component, Show, createSignal } from "solid-js"
import { A, Body, Page } from "../layout/nav"
import { Center, FieldSet } from "../lib/form"
import { createUser, generatePassPhrase, security, setError, setLogin, setSecurity } from "../lib/crypto"
import { useNavigate } from "@solidjs/router"
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
} from "@github/webauthn-json/browser-ponyfill";
import { SiteStore } from "../layout/site_menu"
import { createWs } from "../lib/socket"

export const LoginPasskey = () => {
    return <Passkey login={true} />
}

let isCMA = false;
if (window.PublicKeyCredential &&
    PublicKeyCredential.isConditionalMediationAvailable) {
    // Check if conditional mediation is available.  
    isCMA = await PublicKeyCredential.isConditionalMediationAvailable();
}
// To abort a WebAuthn call, instantiate an `AbortController`.  
const abortController = new AbortController();




export const Passkey: Component<{ login?: boolean }> = (props) => {
    const ws = createWs()
    const nav = useNavigate()
    const [hide, setHide] = createSignal(true)
    const [bip39, setBip39] = createSignal(false)

    const fn = async () => {
        // const publicKeyCredentialRequestOptions = {
        //     // Server generated challenge  
        //     challenge: new Uint8Array(0),
        //     // The same RP ID as used during registration  
        //     rpId: 'example.com',
        // };
        const sec = security()
        const o2 = await ws.rpcj<any>("login", {
            device: sec.deviceDid,
            //username: sec.userDid // maybe empty
        })
        const cro = parseRequestOptionsFromJSON(o2)

        console.log("waiting for sign")
        const o = await get({
            publicKey: cro.publicKey,
            signal: abortController.signal,
            // Specify 'conditional' to activate conditional UI  
            mediation: 'conditional'
        })
        console.log("got sign")
        // const o = await navigator.credentials.get({
        //     publicKey: o2,
        //     signal: abortController.signal,
        //     // Specify 'conditional' to activate conditional UI  
        //     mediation: 'conditional'
        // });
        // send the credential to the server for validation
        const reg = await ws.rpcj<SiteStore>("login2", o.toJSON())
        setLogin(true)
        // instead of navigate we need get the site first
        // then we can navigate in it. the site might tell us the first url
        nav("/")
    }
    fn()

    let el: HTMLInputElement
    function togglePassword() {
        if (el.type === 'password') {
            el.type = 'text';
        } else {
            el.type = 'password';
        }
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
    return <Center>

        <form onSubmit={signin} class="space-y-6 mt-4" action="#" method="post">
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
            <Show when={!bip39()}>
                <div >
                    <div class="flex items-center justify-between">
                        <label for="username" class="block text-sm font-medium leading-6 text-white">User</label>
                        <div class="text-sm hidden">
                            <button onClick={() => setHide(!hide())} class="font-semibold text-indigo-400 hover:text-indigo-300">{hide() ? "Show" : "Hide"} </button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <input autofocus id="username" value="" name="username" type="text" autocomplete="username webauthn" class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
                    </div>
                </div>

                <div>
                    <div class="flex items-center justify-between">
                        <label for="password" class="block text-sm font-medium leading-6 text-white">Password</label>
                        <div class="text-sm">
                            <button onClick={() => setHide(!hide())} class="font-semibold text-indigo-400 hover:text-indigo-300">{hide() ? "Show" : "Hide"} password</button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <input ref={el!} id="password" name="password" type={hide() ? "password" : "text"} autocomplete="current-password" required class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
                    </div>
                </div>
            </Show>
            <div class='mt-4'>
                <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Sign in</button>
            </div>
        </form>
        <Show when={props.login}>
            <A href='/register'  >Register</A>
        </Show>
    </Center>

}


// class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
//<label for="username" class="block text-sm font-medium leading-6 text-white">Email address</label>