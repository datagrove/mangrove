import { useNavigate} from "../core/dg"
import { Show } from "solid-js"
import { A, P } from '../layout/nav'
import { createWs } from "../db/socket";
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
} from "@github/webauthn-json/browser-ponyfill";

import { BlueButton, Center } from "../lib/form";
import { error, hasWebAuthn, security, setError, setLogin, setSecurity, setWelcome } from "../lib/crypto";

export const LoginPage = () => {
    const ws = createWs();
    const navigate = useNavigate();

    const buttonText = () => {
            return "Sign in"
    }

    // this might fail if the server doesn't know the user name,  or if their is no credential for that user locally
    const signin = async () => {
        try {
            const sec = security()
            if (sec.registered) {
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
                navigate("/")
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
            </Show>
            <Show when={!hasWebAuthn()}>
                <P ><A target='_blank' href='https://en.wikipedia.org/wiki/WebAuthn'>Webauthn </A>is needed to create a new user. Please use a browser that supports webauthn and then use that to scan this code</P>
                <img class='w-96 mt-2' src="/qr.png" />
            </Show>
        </div></Center>
}

/*
                <Show when={!security().registered}><ToggleSection header="Link user">
                    <P class='text-center'>Scan from a linked device</P>
                    <img class='w-96 mt-2' src="qr.png" />
                </ToggleSection></Show>
            <Input name="user" label="User" value={user()} onInput={setUser} />

               <div><A href="/login2">More options</A></div>
            */