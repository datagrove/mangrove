import { useNavigate } from "@solidjs/router"
import { createSignal } from "solid-js"
import { A } from '../lib/nav'
import { createWs } from "../lib/socket";
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
    supported,
    AuthenticationPublicKeyCredential,
} from "@github/webauthn-json/browser-ponyfill";

import { BlueButton, Center, Input } from "../lib/form";
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
            return "Register"
        }
    }
    const registerRemote = async () => {
        const sec = security()
        const opt = {
            id: sec!.userDid,
            device: sec!.deviceDid
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
    // this might fail if the server doesn't know the user name,  or if their is no credential for that user locally
    const signin = async () => {
        if (security()?.userDid) {
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
        } else {
            registerRemote()
        }
    }

    return <Center>
        <div class="space-y-4">

            <BlueButton onClick={signin} >{buttonText()}</BlueButton>
         
        </div></Center>
}

/*
            <Input name="user" label="User" value={user()} onInput={setUser} />

               <div><A href="/login2">More options</A></div>
            */