import { Component, Show, createSignal } from "solid-js"
import {  Body, Page } from "../layout/nav"
import { A } from '../core/dg'
import { Center, FieldSet } from "../lib/form"
import { createUser, generatePassPhrase, security, setError, setLogin, setSecurity } from "../lib/crypto"
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
} from "@github/webauthn-json/browser-ponyfill";
import { SiteStore } from "../layout/site_menu"
import { createWs } from "../core/socket"
import { useNavigate } from "../core/dg";

export const LoginPass = () => {
    return <PassworOrBip39 login={true} />
}

export const PassworOrBip39: Component<{ login?: boolean }> = (props) => {
    const ws = createWs()
    const nav = useNavigate()
    const [hide, setHide] = createSignal(true)
    const [bip39, setBip39] = createSignal(false)

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
                const reg = await ws.rpcj<string>("login2", o.toJSON())
                setLogin(reg)
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
                    setLogin(tempName)
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
        <form>
            <p class="text-md dark:text-white text-gray-500">How do you protect your identity?</p>

            <fieldset class='my-4'>
                <div class="space-y-4">


                    <div class="flex items-center">
                        <input checked onInput={() => setBip39(false)} class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600" id='google' type='radio' name='type' value='password' />
                        <label class="ml-3 block text-sm font-medium leading-6 dark:text-white text-gray-900" for='google'>Password manager</label></div>

                    <div class="flex items-center">
                        <input class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600" id='paper' type='radio' name='type' value='bip39' onInput={() => setBip39(true)} />
                        <label class="dark:text-white ml-3 block text-sm font-medium leading-6 text-gray-900" for='paper'>Paper</label>   </div>
                </div>
            </fieldset>
        </form>
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
                <div class='hidden'>
                    <div class="mt-2">
                        <input id="username" value="user" name="username" type="text" autocomplete="username" />
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