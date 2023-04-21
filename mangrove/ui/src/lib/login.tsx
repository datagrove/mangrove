import { A as Ar, useNavigate } from "@solidjs/router"
import { Component, JSXElement, Show, createEffect, createSignal, onMount } from "solid-js"
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
import { A, P } from './nav'
import { createWs } from "./socket";

const isMobile: boolean = (navigator as any)?.userAgentData?.mobile ?? false;

import { Buffer } from 'buffer'
// @ts-ignore
window.Buffer = Buffer;

import * as bip39 from 'bip39'
import * as nacl from 'tweetnacl'
import { Ws } from "./socket";
import { BlueButton, Center, Checkbox, FieldSet, Input, TextDivider, ToggleSection } from "./form";
import { LoginWith } from "./login_with";

const [error, setError] = createSignal("")
export const [token, setToken] = createSignal<string>(localStorage.getItem('token') || '')
export const [user, setUser] = createSignal<string>(localStorage.getItem('user') || '')


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
function bufferToHex(buffer: Uint8Array) {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}



// skip if we have a token to stay logged in
export const RegisterPage = () => {
    const ws = createWs();
    const navigate = useNavigate();
    const [nameOk, setNameOk] = createSignal(false)
    const mn = bip39.generateMnemonic()
    const seed = bip39.mnemonicToSeedSync(mn).subarray(0, 32)
    const kp = nacl.sign.keyPair.fromSeed(seed)
    const [ruser, setRuser] = createSignal("")

    const registerRemote = async () => {
        console.log("registering", mn)
        try {
            const o = await ws.rpcj<any>("register", { id: ruser(), recovery_key: bufferToHex(kp.publicKey) })
            const cco = parseCreationOptionsFromJSON(o)
            const cred = await create(cco)
            const reg = await ws.rpcj<any>("register2", cred.toJSON())
            localStorage.setItem('user', ruser())
            localStorage.setItem("token", reg.token)
            setUser(ruser())
            navigate("/")
        } catch (e: any) {
            console.log(e)
        }
    }

    const register = (e: MessageEvent) => {
        e.preventDefault()
        registerRemote()
    }

    // there is an inherent race here, (two users with the same name), but practically it's not a problem
    const validateUsername = async (x: string) => {
        setRuser(x)
        if (x.length < 1 || x[0] == "_") {
            setNameOk(false)
            return
        }
        let ok = false
        try {
            const o = await ws.rpc<{ available: boolean }>("okname", { id: x })
            console.log("o", o)
            ok = o.available
        } catch (e) {
            console.log("error", e)
        }
        setNameOk(ok)
    }

    const [remember, setRemember] = createSignal(false)
    const [email, setEmail] = createSignal(false)
    const [phone, setPhone] = createSignal(false)
    const [password, setPassword] = createSignal(false)
    const [email2, setEmail2] = createSignal("")
    const [phone2, setPhone2] = createSignal("")
    const [password2, setPassword2] = createSignal("")
    const [pin, setPin] = createSignal(false)
    const [pin2, setPin2] = createSignal("")
    const [oauth, setOauth] = createSignal(false)
    const [totp, setTotp] = createSignal(false)


    return <Center>
        <form>
            <div class="space-y-6">
                <Show when={!isMobile}>
                    <div>You may want to register on your phone, then use that to login on your computer.
                        <ToggleSection header='Tell me more'><P> That would most easily allow you to log into any computer securely as long as you have your phone.</P>
                        </ToggleSection></div>
                </Show>

                <Input autofocus name="user" label="User" value='' onInput={validateUsername} />
                <div>{ruser() ? `${ruser()} is ${nameOk() ? "" : "not"} available` : ""}</div>

                <TextDivider>Secret phrase</TextDivider>

                <P class='text-green-900'>{mn}</P>
                <div class='italic'>Write down your secret phrase. It can be used to regenerate your private key. It is not stored anywhere, so if you lose it, you could lose access to your account.</div>
                <TextDivider>Options</TextDivider>
                <div ><span >Each recovery option reduces the security of your account but may allow you more convenience. </span>
                    <div class='mt-1'> <A href=''>Tell me more</A> </div></div>
                <FieldSet>
                    <Checkbox value={remember} setValue={setRemember} title='Trusted Computer' >Remember your login for 30 days</Checkbox>
                    <Checkbox value={email} setValue={setEmail} title='Email recovery' >Allow email recovery</Checkbox>
                    <Show when={email()}>
                        <Input value={email2()} name="email" placeholder="Email" />
                    </Show>
                    <Checkbox value={phone} setValue={setPhone} title='Phone recovery' >Allow phone/text based recovery</Checkbox>
                    <Show when={phone()}>
                        <Input value={phone2()} name="phone" placeholder="Phone" />
                    </Show>
                    <Checkbox value={password} setValue={setPassword} title='Password Manager' >Allow Password Manger</Checkbox>
                    <Show when={password()}>
                        <Input type='password' value={password2()} name="phone" placeholder="Password" />
                        <Input type='password' value={password2()} name="phone" placeholder="Confirm" />
                    </Show>
                    <Checkbox value={pin} setValue={setPin} title='PIN recovery' >Require PIN for recovery</Checkbox>
                    <Show when={pin()}>
                        <Input type='password' value={pin2()} name="pin" label="PIN" />
                        <Input type='password' value={pin2()} name="pin" label="Confirm" />
                    </Show>
                    <Checkbox value={totp} setValue={setTotp} title='Phone App recovery' >Store recovery code with Authy, Google Authenticator, or Microsoft Authenticator (Time based code) </Checkbox>
                    <Show when={totp()}>
                        <img src='qr.png'></img>
                    </Show>
                    <Checkbox value={oauth} setValue={setOauth} title='OAuth login' >Recover account by logging in with Apple, Google, Twitter, or Github</Checkbox>
                    <Show when={oauth()}>
                        <LoginWith></LoginWith></Show>
                </FieldSet>

                <BlueButton disabled={!nameOk()} onClick={register} >Register</BlueButton>
            </div></form>

    </Center>
}

export const RecoveryPage = () => {
    const ws = createWs();
    const [ph, setPh] = createSignal("")
    const navigate = useNavigate();
    const register = async () => {
        try {
            const sid = await ws.rpcj<string>('sessionid')
            const mn = bip39.generateMnemonic()
            const seed = bip39.mnemonicToSeedSync(mn).subarray(0, 32)
            const kp = nacl.sign.keyPair.fromSeed(seed)
            const sig = nacl.sign(Buffer.from(ph()), kp.secretKey)
            const o = await ws.rpcj<any>("recover", { id: user(), signature: bufferToHex(sig) })
            const cco = parseCreationOptionsFromJSON(o)
            const cred = await create(cco)
            const reg = await ws.rpcj<any>("register2", cred.toJSON())
            localStorage.setItem('user', user())
            localStorage.setItem("token", reg.token)
            navigate("/")
        } catch (e: any) {
            console.log(e)
        }
    }

    const ok = () => bip39.validateMnemonic(ph())
    let o: HTMLTextAreaElement
    return <Center> <form><label for='memo'>Recovery Phrase</label><textarea onInput={(e) => setPh(e.target.value)} rows='3' class='text-green-900 w-full my-2' id='memo' placeholder="match cost vague logic negative warrior chimney blanket razor work rebel silk">

    </textarea>
        <Show when={ph() && !ok()}><P class='text-red-500 mb-2'>Invalid phrase</P></Show>
        <BlueButton disabled={!ok()} onClick={register}>Register</BlueButton>
    </form></Center>
}

export const LoginPage = () => {
    const ws = createWs();
    const navigate = useNavigate();
    const [sessid, setSessid] = createSignal("")

    // this might fail if the server doesn't know the user name,  or if their is no credential for that user locally
    const signin = async () => {
        const username = user()
        localStorage.setItem('user', user())
        try {
            const o2 = await ws.rpcj<any>("login", { username: username })
            const cro = parseRequestOptionsFromJSON(o2)
            const o = await get(cro)
            const reg = await ws.rpcj<any>("login2", o.toJSON())
            setToken(reg.token)
            localStorage.setItem("token", reg.token)
            navigate("/")
        } catch (e: any) {
            navigate("/login2")
            console.log("error", e)
            setError(e)
        }
    }

    return <Center>
        <div class="space-y-4">
            <Input name="user" label="User" value={user()} onInput={setUser} />
            <BlueButton onClick={signin} >Sign in</BlueButton>
            <div><A href="/login2">More options</A></div>
        </div></Center>
}

// skip if we have a token to stay logged in
export const LoginPage2 = () => {
    const ws = createWs();
    const navigate = useNavigate();
    const [sessid, setSessid] = createSignal("")

    const loginRemote = async (username: string) => {
        try {
            const o2 = await ws.rpcj<any>("login", { username: username })
            const cro = parseRequestOptionsFromJSON(o2)
            const o = await get(cro)
            const reg = await ws.rpcj<any>("login2", o.toJSON())
            setToken(reg.token)
            localStorage.setItem("token", reg.token)
            navigate("/")
        } catch (e: any) {
            setError(e.toString())
        }
    }
    const signin = () => {
        console.log("signin", user())
        localStorage.setItem('user', user())
        loginRemote(user())
    }
    createEffect(async () => {
        if (sessionStorage.getItem('token')) {
            navigate('/home', { replace: true })
        }
        let sid = await ws.rpc<string>('sessionid')
        //sid = `http://www.datagrove.com/remote/${sid}`
        setSessid(sid)
    })

    const [copied, setCopied] = createSignal(false)
    const copyLink = () => {
        navigator.clipboard.writeText(`http://www.datagrove.com/remote/${sessid()}`)
        setCopied(true)
    }

    return <Center>
        <Show when={error()}>
            <P class='text-red-500'>{error()}</P>
        </Show>
        <div class="space-y-6">
            <Input name="user" label="User" value={user()} onInput={setUser} />
            <BlueButton onClick={() => signin()} >Sign in</BlueButton>
        </div>
        <P><A href="/register">Register New Account</A></P>
        <P><A href="/recover">Login with recovery phrase</A></P>
        <TextDivider>Login with phone browser</TextDivider>

        <img class='my-8' alt='' src='qr.png' />
        <div>Scan with your phone camera app and proceed to website to log in. Logging in with your phone is an easy and secure way to keep your passcode available</div>
        <P><button class='text-indigo-600 hover:text-blue-500 hover:underline' onClick={copyLink}>Copy link to clipboard</button> {copied() ? '✅' : ''}</P>


        {/* The list of options here depends on the account*/}
    </Center>
}



