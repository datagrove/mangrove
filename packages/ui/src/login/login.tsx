
import { Body, Center, Page, Title } from "..";
import { Component, JSX, Show, createSignal } from "solid-js";
import { useLn } from "./passkey_i18n";
import { DarkButton } from "../layout/site_menu";
import { BlueButton } from "../lib/form";
import { Username, Password, AddPasskey, EmailInput, GetSecret, Input, InputLabel, PhoneInput, getLoginChoice, loginChoice } from "./passkey_add";
import { LanguageSelect } from "../i18n/i18";
import { initPasskey } from "./passkey";
import { createWs } from "../lib/socket";
import { A } from "../layout/nav";

// when this page logs in successfully, how do we get the user to the right place?
const afterlogin = () => { return "www.espn.com" }
interface LoginInfo {
    Error: number,
    Cookie: string,
    Home: string
}
export const LoginPage: Component<{ allow?: string[] }> = (props) => {
    const ws = createWs()
    const ln = useLn()
    const [isOpenAddKeyDialog, openAddKeyDialog] = createSignal(false)
    const [isOpenSecretDialog, openSecretDialog] = createSignal(false)
    const [user, setUser] = createSignal("")
    const [password, setPassword] = createSignal("")
    const [error, setError] = createSignal("")
    const [register, setRegister] = createSignal(false)
    const [phone, setPhone] = createSignal("")
    const [email, setEmail] = createSignal("")

    // when we set this up we need to start a promise to gather passkeys that are offered
    // This points out the case that we get a passkey that we don't know
    // in this case we still need to get the user name and password
    initPasskey(setError).then((ok) => {
        console.log("passkey init", ok)
    })

    const submit = async (e: any) => {
        e.preventDefault()
        if (register()) {
            const [log, e] = await ws.rpcje<LoginInfo>("register", { username: user(), password: password() })
            if (e) {
                setError(e)
                return
            }
            // we should ask for a factor here
            // we should show that a password is optional for new users.
            //location.href = log!.Home
            // fall through to log in, this will ask for a factor 
        }
        await getLoginChoice(user(), password())
        setError(loginChoice()?.error ?? "")
        if (loginChoice()?.factor == "") {
            openAddKeyDialog(true)// we need to add a passkey
        } else {
            openSecretDialog(true)
        }
    }
    const onCloseAddKey = (e: any) => {
        console.log("closed passkey dialog")
        openAddKeyDialog(false)
    }

    // called when the user has confirmed the secret or has given up
    const confirmSecret = (ok: boolean) => {
        // either way we close the dialog
        openSecretDialog(false)

        // we should get this from register2 or login2
        location.href = afterlogin();
    }
    const validate = async (secret: string) => {
        // this must be a socket call
        return secret == "1234"
    }
    return <div dir={ln().dir}>
        <AddPasskey when={isOpenAddKeyDialog} onChange={onCloseAddKey} validate={validate} />
        <GetSecret validate={validate} when={isOpenSecretDialog} onChange={confirmSecret} />
        <div class='fixed w-screen flex flex-row items-center pr-4'>
            <div class='flex-1' />
            <div class='w-48'><LanguageSelect /></div>
            <DarkButton /></div>
        <Center>
            <Show when={!isOpenAddKeyDialog() && !isOpenSecretDialog()}>
                <form class='space-y-6' onSubmit={submit} >
                    <Show when={error()}> <div>{error()}</div></Show>
                    <Username onInput={(e: any) => setUser(e.target.value)} />
                    <Password onInput={(e: any) => setPassword(e.target.value)} />
                    <Show when={register()}>
                        <PhoneInput onInput={(e: any) => setPhone(e.target.value)} />
                        <EmailInput onInput={(e: any) => setEmail(e.target.value)} />
                    </Show>
                    <BlueButton >{register() ? ln().register : ln().signin}</BlueButton>
                </form></Show>

            <div class='mt-2'><A href='#' onClick={() => setRegister(!register())}>{register() ? "Sign in" : "Register"}</A></div>
            <button class='hidden' onClick={() => openSecretDialog(true)}>get secret</button>
        </Center>
    </div>
}

function Register() {
    return <Page>
        <Title />
        <Body>Register</Body>
    </Page>
}

