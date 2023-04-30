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
import { A, P } from '../layout/nav'
import { createWs } from "../lib/socket";


import * as bip39 from 'bip39'
import * as nacl from 'tweetnacl'
import { Ws } from "../lib/socket";
import { BlueButton, Center, Checkbox, FieldSet, Input, TextDivider, ToggleSection } from "../lib/form";
import { LoginWith } from "../lib/login_with";
import { Buffer } from 'buffer'
import { bufferToHex } from "../lib/encode";
import { error, setError, setLogin, setUser, user } from "../lib/crypto";
// @ts-ignore


export const RecoveryPage = () => {
    const ws = createWs();
    const [ph, setPh] = createSignal("")
    const navigate = useNavigate();
    const register = async () => {
        try {
            const mn = bip39.generateMnemonic()
            const seed = bip39.mnemonicToSeedSync(mn).subarray(0, 32)
            const kp = nacl.sign.keyPair.fromSeed(seed)
            const sig = nacl.sign(Buffer.from(ph()), kp.secretKey)


            const o = await ws.rpcj<any>("recover", { id: user(), signature: bufferToHex(sig) })
            const cco = parseCreationOptionsFromJSON(o)
            const cred = await create(cco)
            const reg = await ws.rpcj<any>("register2", cred.toJSON())
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

export const LoginPageOld = () => {
    const ws = createWs();
    const navigate = useNavigate();
    const [sessid, setSessid] = createSignal("")

    // this might fail if the server doesn't know the user name,  or if their is no credential for that user locally
    const signin = async () => {
        const username = user()

        try {
            const o2 = await ws.rpcj<any>("login", { username: username })
            const cro = parseRequestOptionsFromJSON(o2)
            const o = await get(cro)
            const reg = await ws.rpcj<any>("login2", o.toJSON())
            setLogin(true)
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
            setLogin(true)

            navigate("/")
        } catch (e: any) {
            setError(e.toString())
        }
    }
    const signin = () => {
        console.log("signin", user())

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



