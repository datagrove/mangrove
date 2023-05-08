
// for imis we should try to intercept the registration and just steal the password if it succeeds.
// for 1199 we don't need registration at all; just a QR code for pat?
// how does pat grant then?

import { createSignal } from "solid-js"
import { createWs } from "../core/socket"
import { CellOptions, cell } from "../db/client"
import { BlueButton } from "../lib/form"
import { InputCell, PasswordCell } from "./passkey_add"
import { useLn } from "./passkey_i18n"
import { SimplePage } from "../layout/nav"
import { autofocus } from "@solid-primitives/autofocus";

// for 1199 I can create a password and send it.
export const user: CellOptions = {
    name: "username",
    autocomplete: "username webauthn"
}
export const password: CellOptions = {
    name: "password",
    type: "password",
}
export const email: CellOptions = {
    name: "email",
}
export const phone: CellOptions = {
    name: "phone",
}
export const RegisterPage = () => <SimplePage><Register /></SimplePage>

const Register = () => {
    const ws = createWs()
    const ln = useLn()
    // registration is a transaction, but then we later want to be able to edit 
    const data = {
        user: cell(user),
        password: cell(password),
        email: cell(email),
        phone: cell(phone),
    }
    const [okname, setOkname] = createSignal(false)
    const submitRegister = async () => {
        // we need to check if the name is available
        data.user.setError(`${data.user.value()} is not available`)
        return
        const [ok, e] = await ws.rpcje<boolean>("okname", { name: data.user.value() })
        if (!e && ok) {
            setOkname(true)
        } else {
            setOkname(false)
        }
    }

    return <form method='post' class='space-y-6' onSubmit={(e: any) => e.preventDefault()} >
        <InputCell cell={data.user} />
        <PasswordCell cell={data.password} />
        <BlueButton onClick={() => submitRegister()} disabled={!data.user.value()} >{ln().register}</BlueButton>
    </form>

}



// registration should allow the user to enter a username, but this doesn't need to be unique always. For some websites they will want to enforce uniqueness.
/*
        <Username ref={el!} onInput={(e: any) => setUser(e.target.value)} />
        <Show when={user()}><div>{user()} is {okname() ? "" : "not"} available</div></Show>
        <Password onInput={(e: any) => setPassword(e.target.value)} />


    const [okname, setOkname] = createSignal(false)
        if (register()) {
            // we need to check if the name is available
            const [ok, e] = await ws.rpcje<boolean>("okname", { name: u })
            if (!e && ok) {
                setOkname(true)
            } else {
                setOkname(false)
            }
        }
                    <Match when={screen() == Screen.Register}>
                        <form method='post' class='space-y-6' onSubmit={(e:any)=>e.preventDefault()} >
                            <Username ref={el!} onInput={(e: any) => setUser(e.target.value)} />
                            <Show when={user()}><div>{user()} is {okname() ? "" : "not"} available</div></Show>
                            <Password onInput={(e: any) => setPassword(e.target.value)} />
                            <BlueButton disabled={register() && !okname()} >{ln().register}</BlueButton>
                        </form>


                    </Match>
export function Register() {

    // registration is a transaction, but then we later want to be able to edit 
    const data = {
        user: cell(),
        password: cell(),
    }

    const submitRegister = async (e: any) => {
        e.preventDefault()
        if (register()) {
            const [log, e] = await ws.rpcje<LoginInfo>("createuser", { username: user(), password: password() })
            if (e) {
                setError(e)
                return
            }
            setLoginInfo(loginInfo)
            // ask for second factor here.
            abortController.abort()
            setScreen(Screen.AddKey)
        }
    }



    return <Page>
        <Title />
        <Body>
        <form method='post' class='space-y-6' onSubmit={submitRegister} >
        <Username ref={el!} onInput={(e: any) => setUser(e.target.value)} />
        <Show when={user()}><div>{user()} is {okname() ? "" : "not"} available</div></Show>
        <Password onInput={(e: any) => setPassword(e.target.value)} />
        <BlueButton disabled={register() && !okname()} >{ln().register}</BlueButton>
        </form>
        </Body>
    </Page>
}
*/
