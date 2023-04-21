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
import { A, P } from '../lib/nav'
import { createWs } from "../lib/socket";
import { Ws } from "../lib/socket";
import { BlueButton, Center, Checkbox, FieldSet, Input, TextDivider, ToggleSection } from "../lib/form";
import { LoginWith } from "../lib/login_with";
import { bufferToHex } from "../lib/encode";
import { CertifyUser, generatePassPhrase, isMobile, setUser } from "../lib/crypto";

// skip if we have a token to stay logged in
export const RegisterPage = () => {
    const ws = createWs();
    const navigate = useNavigate();
    const [nameOk, setNameOk] = createSignal(false)
    const mn = generatePassPhrase()
    const [ruser, setRuser] = createSignal("")

    const registerRemote = async () => {
        try {
            // we have our passphrase now, we can create a certificate and register it
            // then we could finish the setup with webauthn. we could even skip it
            const cert = CertifyUser(mn)

            const o = await ws.rpcj<any>("register", { id: ruser(), recovery_key: cert})
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
    const [device, setDevice] = createSignal("")
    const suggestedName = () => {
        const u = ruser()
        if (u) {
            return u + "'s computer"
        } else {
            return "My computer"
        }
    }
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

                <Input name="device" placeholder={suggestedName()} label="Device Name" value='' onInput={setDevice} />
                

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

                <BlueButton disabled={!nameOk() || !device()} onClick={register} >Register</BlueButton>
            </div></form>

    </Center>
}
