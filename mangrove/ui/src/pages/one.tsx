import { useNavigate } from "@solidjs/router"
import { createSignal } from "solid-js"
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
import { security, setError, setLogin, setSecurity, setUser, ucanFromBip39, user } from "../lib/crypto";

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
        const sec = security()
        if (sec.registered) {
            try {
                const o2 = await ws.rpcj<any>("login", { username: sec.userDid })
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
        } else {
            const opt = {
                id: sec.userDid,
                device: sec.deviceDid
            }
            try {
                const o = await ws.rpcj<any>("register", opt)
                const cco = parseCreationOptionsFromJSON(o)
                const cred = await create(cco)
                const reg = await ws.rpcj<any>("register2", cred.toJSON())
                if (reg.token) {
                    setSecurity({
                        ...sec,
                        registered: true,
                    })
                    setLogin(true)
                    navigate("/")
                }
            } catch (e: any) {
                console.log(e)
            }
        }
    }

    return <Center>
        <div class="space-y-4">

            <BlueButton onClick={signin} >{buttonText()}</BlueButton>
            <ToggleSection header="Link existing user">
                <P class='text-center'>Scan from a linked device</P>
                <img class='w-96 mt-2' src="qr.png" />
            </ToggleSection>

        </div></Center>
}

/*
            <Input name="user" label="User" value={user()} onInput={setUser} />

               <div><A href="/login2">More options</A></div>
            */