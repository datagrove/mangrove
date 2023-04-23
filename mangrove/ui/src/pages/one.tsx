import { useNavigate } from "@solidjs/router"
import { Show, createSignal } from "solid-js"
import { A, P } from '../lib/nav'
import { createWs } from "../lib/socket";
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
    supported,
    AuthenticationPublicKeyCredential,
} from "@github/webauthn-json/browser-ponyfill";

import { BlueButton, Center, Input, ToggleSection } from "../lib/form";
import { Buffer } from 'buffer'
import { error, hasWebAuthn, security, setError, setLogin, setSecurity, setUser, setWelcome, ucanFromBip39, user } from "../lib/crypto";

// we 


export const LoginPage = () => {
    const ws = createWs();
    const navigate = useNavigate();

    const buttonText = () => {
        if (security().registered) {
            return "Sign in"
        } else {
            return "Create user"
        }
    }

    // this might fail if the server doesn't know the user name,  or if their is no credential for that user locally
    const signin = async () => {
        try {
            const sec = security()
            if (sec.registered) {
                const o2 = await ws.rpcj<any>("login", { username: sec.userDid })
                const cro = parseRequestOptionsFromJSON(o2)
                const o = await get(cro)
                const reg = await ws.rpcj<any>("login2", o.toJSON())
                setLogin(true)
                navigate("/")

            } else {
                const o = await ws.rpcj<any>("register", {
                    id: sec.userDid,
                    device: sec.deviceDid
                })
                const cco = parseCreationOptionsFromJSON(o)
                const cred = await create(cco)
                const tempName = await ws.rpcj<string>("register2", cred.toJSON())
                if (tempName) {
                    setSecurity({
                        ...sec,
                        username: tempName,
                        registered: true,
                    })
                    setLogin(true)
                    setWelcome(true)
                    navigate("/")
                } else {
                    setError("Registration failed")
                }
            }
        } catch (e: any) {
            setError(e)
        }
    }

    return <Center>
        <div class="space-y-4">
            <Show when={error()}>
                <P class='text-red-500'>{error()}</P>
            </Show>
            <Show when={hasWebAuthn()}>
                <BlueButton onClick={signin} >{buttonText()}</BlueButton>
                <Show when={!security().registered}><ToggleSection header="Link user">
                    <P class='text-center'>Scan from a linked device</P>
                    <img class='w-96 mt-2' src="qr.png" />
                </ToggleSection></Show>
            </Show>
            <Show when={!hasWebAuthn()}>
                <P ><A target='_blank' href='https://en.wikipedia.org/wiki/WebAuthn'>Webauthn </A>is needed to create a new user. Please use a browser that supports webauthn and then use that to scan this code</P>
                <img class='w-96 mt-2' src="qr.png" />
            </Show>

        </div></Center>
}

/*
            <Input name="user" label="User" value={user()} onInput={setUser} />

               <div><A href="/login2">More options</A></div>
            */