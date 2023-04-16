import { A as Ar, useNavigate } from "@solidjs/router"
import { Component, JSXElement, createEffect, createSignal } from "solid-js"
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
    supported,
    AuthenticationPublicKeyCredential,
} from "@github/webauthn-json/browser-ponyfill";
import { type PublicKeyCredentialDescriptorJSON } from "@github/webauthn-json";
import { RegistrationPublicKeyCredential } from "@github/webauthn-json/browser-ponyfill"
import type { RegistrationResponseExtendedJSON } from "@github/webauthn-json/browser-ponyfill/extended"


export const Center: Component<{ children: JSXElement }> = (props) => {
    return <div class="grid place-items-center h-screen">
        <div class='w-64'>
            {props.children}
        </div></div>
}

const BlueButton: Component<{ onClick: () => void, children: JSXElement, disabled?: boolean }> = (props) => {
    return <button disabled={props.disabled} onClick={props.onClick} class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">{props.children}</button>
}

const Input: Component<{
    name: string,
    onInput?: (x: string) => void,
    onChange?: (x: string) => void,
    value: string,
    label: string,
    placeholder?: string
}> = (props) => {

    return <div>
        <label for={props.name} class="block text-sm font-medium leading-6 text-neutral-900 dark:text-white">{props.label}</label>
        <input value={props.value} onInput={(e) => {
            if (props.onInput) props.onInput((e.target as HTMLInputElement).value)
        }} id={props.name} type="text"
            onchange={(e) => {
                if (props.onInput)
                    props.onInput((e.target as HTMLInputElement).value)
            }} placeholder={props.placeholder} class="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 disabled:opacity-50 focus:border-indigo-500" /></div>
}
export const TextDivider: Component<{ children: string }> = (props) => {
    return <div class="relative mt-4">
        <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
            <span class="bg-white dark:bg-black px-2 text-gray-500">{props.children}</span>
        </div>
    </div>
}

export const PasswordPage = () => {
    const navigate = useNavigate();
    const [inp, setInp] = createSignal("")
    const login = () => {
        sessionStorage.setItem('token', 'mytokenisawesome');
        navigate('/home');
    };

    return <Center>
        <div class="space-y-6">
            <div>
                <label for="password" class="block text-sm font-medium leading-6 text-neutral-900 dark:text-white">Password</label>
                <div class="mt-2">
                    <Input value={inp() ?? ""} onInput={setInp} name="password" label="Password" />
                </div>
            </div><div>
                <BlueButton onClick={login} >Sign in</BlueButton>
            </div>
        </div>
    </Center>
}

async function okName(name: string) : Promise<boolean> {
    try {
         const o = await (await fetch("/api/okname",{
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({id: name})

         })).json()
         console.log("o",o)
         return o.available
    }catch(e) {
        console.log("error", e)
        return false
    }
}

// skip if we have a token to stay logged in
export const RegisterPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = createSignal("")
    const [nameOk, setNameOk] = createSignal(false)
    const signin = () => {
        console.log("signin", user())
        localStorage.setItem('user', user())
        registerRemote(user())
        navigate("/home")
    }

    // there is an inherent race here, (two users with the same name), but practically it's not a problem
    const validateUsername = async (x: string) => {
        setUser(x)
        setNameOk(await okName(user()))
    }

    return <Center>
        <div class="space-y-6">
            <Input name="user" label="User" value={user()} onInput={validateUsername} />
            <div>{"Not available"}</div>
            <BlueButton disabled={!nameOk()} onClick={() => signin()} >Register wtf</BlueButton>
        </div>
        <TextDivider>Or login with phone browser</TextDivider>
        <img class='my-8' alt='' src='qr.png' />
        <div>Scan with your phone camera app and proceed to website to log in. Logging in with your phone is an easy and secure way to keep your passcode available</div>
    </Center>
}
// skip if we have a token to stay logged in
export const LoginPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = createSignal(localStorage.getItem('user') ?? "")
    const signin = () => {
        console.log("signin", user())
        localStorage.setItem('user', user())
        loginRemote(user())
        //navigate("/pw", { replace: true })
    }
    createEffect(() => {
        if (sessionStorage.getItem('token')) {
            navigate('/home', { replace: true })
        }
    })

    return <Center>
        <div class="space-y-6">
            <Input name="user" label="User" value={user()} onInput={setUser} />
            <BlueButton onClick={() => signin()} >Sign in</BlueButton>
        </div>
        <P><A href="/register">Register New Account</A></P>
        <P><A href="/recover">Login with recovery phrase</A></P>

        <TextDivider>Or login with phone browser</TextDivider>
        <img class='my-8' alt='' src='qr.png' />
        <div>Scan with your phone camera app and proceed to website to log in. Logging in with your phone is an easy and secure way to keep your passcode available</div>

    </Center>
}
const A: Component<{ href: string, children: JSXElement }> = (props) => {
    return <Ar class='text-indigo-600 hover:text-blue-500 hover:underline' href={props.href}>{props.children}</Ar>
}
const P: Component<{ children: JSXElement }> = (props) => {
    return <p class="mt-2"  >{props.children}</p>
}


async function registerRemote(username: string): Promise<string> {
    try {
        const o = await (await fetch("/api/register", {})).json()
        console.log(o)
        const cco = parseCreationOptionsFromJSON(o)
        console.log("cco", cco)
        const cred = await create(cco)
        console.log("cred", cred)
        const reg = await (await fetch("/api/register2", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cred.toJSON())
        })).json()
        console.log("reg", reg)
    } catch (e: any) {
        return e.toString()
    }
    return ""
}
async function loginRemote(username: string) {
    try {
        const o2 = await (await fetch("/api/login", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username })
        })).json()
        console.log("o2", o2)
        const cro = parseRequestOptionsFromJSON(o2)
        console.log("cro", cro)
        const o = await get(cro)
        console.log("o", o)
        const reg = await (await fetch("/api/login2", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(o.toJSON())
        })).json()
        console.log("reg", reg)
    } catch (e: any) {
        console.log("error", e.toString())
    }
}
