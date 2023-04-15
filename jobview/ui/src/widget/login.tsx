import { useNavigate } from "@solidjs/router"
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

const BlueButton: Component<{ onClick: () => void, children: JSXElement }> = (props) => {
    return <button onClick={props.onClick} class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">{props.children}</button>
}

const Input: Component<{
    name: string,
    onchange: (x: string) => void,
    value: string,
    label: string,
    placeholder?: string
}> = (props) => {
    return <div>
        <label for={props.name} class="block text-sm font-medium leading-6 text-neutral-900 dark:text-white">{props.label}</label>
        <input value={props.value} id={props.name} type="text" onchange={(e) => props.onchange((e.target as HTMLInputElement).value)} placeholder={props.placeholder} class="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:border-indigo-500" /></div>
}

export const PasswordPage = () => {
    const navigate = useNavigate();
    const login = () => {
        sessionStorage.setItem('token', 'mytokenisawesome');
        navigate('/home');
    };

    const LoginPassword: Component<{ oninput: (x: string) => void }> = (props) => {
        let inp: HTMLInputElement
        return <><form>
            <div class="space-y-6">
                <div>
                    <label for="password" class="block text-sm font-medium leading-6 text-neutral-900 dark:text-white">Password</label>
                    <div class="mt-2">
                        <input ref={inp!} id="password" name="password" type="password" autocomplete="email" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2" />
                    </div>
                </div><div>
                    <BlueButton onClick={() => props.oninput(inp!.value)} >Sign in</BlueButton>
                </div>
            </div>
        </form></>
    }


    return <Center>
        <LoginPassword oninput={(x: string) => { login() }}></LoginPassword>
    </Center>
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

export const LoginWith = () => {
    return <div class="mt-6">

        <div class="grid grid-cols-3 gap-3">
            <div>
                <a href="#" class="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0">
                    <span class="sr-only">Sign in with Facebook</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clip-rule="evenodd" />
                    </svg>
                </a>
            </div>

            <div>
                <a href="#" class="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0">
                    <span class="sr-only">Sign in with Twitter</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                </a>
            </div>

            <div>
                <a href="#" class="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0">
                    <span class="sr-only">Sign in with GitHub</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
                    </svg>
                </a>
            </div>
        </div>
    </div>
}
// skip if we have a token to stay logged in
export const RegisterPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = createSignal(localStorage.getItem('user') ?? "")
    const signin = () => {
        console.log("signin", user())
        localStorage.setItem('user', user())
        registerRemote(user())
        navigate("/home")
    }

    return <Center>
        <form>
            <TestUi />
            <div class="space-y-6">
                <Input name="user" label="User" value={user()} onchange={setUser} />
                <BlueButton onClick={() => signin()} >Register</BlueButton>
            </div>
        </form>
        <TextDivider>Or continue with</TextDivider>
        <LoginWith />
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
        navigate("/pw", { replace: true })
    }
    createEffect(() => {
        if (sessionStorage.getItem('token')) {
            navigate('/home', { replace: true })
        }
    })

    return <Center>
        <form>
            <div class="space-y-6">
                <Input name="user" label="User" value={user()} onchange={setUser} />
                <BlueButton onClick={() => signin()} >Sign in</BlueButton>
            </div>
        </form>
        <TextDivider>Or continue with</TextDivider>
        <LoginWith />
        <TextDivider>Or login with phone browser</TextDivider>
        <img class='my-8' alt='' src='qr.png' />
        <div>Scan with your phone camera app and proceed to website to log in. Logging in with your phone is an easy and secure way to keep your passcode available</div>
    </Center>
}

const TestUi: Component = () => {
    return <div>  {supported() ? <div>Supported</div> : <div>Not supported</div>}
        <button onClick={register}>Register</button>
        <button onClick={() => authenticate()}>Authenticate</button>
        <button onClick={() => setRegistrations([])}>Clear</button></div>
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
        const cro = parseRequestOptionsFromJSON(await (await fetch("/api/login", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username })
        })).json())
        const o = get(cro)
        const reg = await (await fetch("/api/login2", {})).json()
    } catch (e: any) {
        return e.toString()
    }
    return ""
}

// demo mostly uses non ponyfill functions
function registeredCredentials(): PublicKeyCredentialDescriptorJSON[] {
    return getRegistrations().map((reg) => ({
        id: reg.rawId,
        type: reg.type,
    }));
}
async function register(): Promise<void> {
    const cco = parseCreationOptionsFromJSON({
        publicKey: {
            challenge: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
            rp: { name: "Localhost, Inc." },
            user: {
                id: "IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII",
                name: "test_user",
                displayName: "Test User",
            },
            pubKeyCredParams: [],
            excludeCredentials: registeredCredentials(),
            authenticatorSelection: { userVerification: "discouraged" },
            extensions: {
                credProps: true,
            },
        },
    });
    addRegistration(await create(cco));
}

async function authenticate(options?: {
    conditionalMediation?: boolean;
}): Promise<AuthenticationPublicKeyCredential> {
    const cro = parseRequestOptionsFromJSON({
        publicKey: {
            challenge: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
            allowCredentials: registeredCredentials(),
            userVerification: "discouraged",
        },
    });
    return get(cro);
}

// use localStorage to save registrations.
const getRegistrations = () => JSON.parse(localStorage.webauthnExampleRegistrations || "[]") as RegistrationResponseExtendedJSON[];
function setRegistrations(registrations: RegistrationResponseExtendedJSON[]): void {
    localStorage.webauthnExampleRegistrations = JSON.stringify(registrations, null, "  ",
    );
}
function addRegistration(registration: RegistrationPublicKeyCredential): void {
    const registrations = getRegistrations();
    registrations.push(registration.toJSON());
    setRegistrations(registrations);
}
