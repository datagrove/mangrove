
import { Body, Center, Page, Title } from "..";
import { Component, Show, createSignal } from "solid-js";
import { useLn } from "./passkey_i18n";
import { DarkButton } from "../layout/site_menu";
import { BlueButton } from "../lib/form";
import { AddPasskey, GetSecret, Input, InputLabel, getLoginChoice, loginChoice } from "./passkey_add";
import { LanguageSelect } from "../i18n/i18";
import { initPasskey } from "./passkey";

const Username: Component<{}> = (props) => {
    const ln = useLn()

    return <div >
        <div class="flex items-center justify-between">
            <InputLabel for="username" >{ln().username}</InputLabel>
        </div>
        <div class="mt-2">
            <Input  {...props} placeholder={ln().enterUsername} autofocus id="username" name="username" type="text" autocomplete="username webauthn" class="block w-full rounded-md border-0 dark:bg-neutral-900 bg-neutral-100 py-1.5  shadow-sm ring-1 ring-inset dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
        </div>
    </div>
}


const Password: Component = (props) => {
    const ln = useLn()
    const [hide, setHide] = createSignal(true)
    let el: HTMLInputElement

    const toggle = (e: any) => {
        e.preventDefault()
        setHide(!hide())
        if (!hide()) {
            el.type = 'text';
        } else {
            el.type = 'password';
        }
    }

    return <div>
        <div class="flex items-center justify-between">
            <InputLabel for="password" >{ln().password}</InputLabel>
            <div class="text-sm">
                <button onClick={toggle} class="font-semibold hover:underline text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">{hide() ? ln().show : ln().hide} {ln().password}</button>
            </div>
        </div>
        <div class="mt-2">
            <Input ref={el!} id="password" name="password" type={hide() ? "password" : "text"} autocomplete="current-password" required placeholder={ln().enterPassword} />
        </div>
    </div>
}

// when this page logs in successfully, how do we get the user to the right place?
const afterlogin = () => { return "www.espn.com"}

export const LoginPage: Component<{allow?: string[]}> = (props) => {
    const ln = useLn()
    const [isOpenAddKeyDialog, openAddKeyDialog] = createSignal(false)
    const [isOpenSecretDialog, openSecretDialog] = createSignal(false)
    const [user, setUser] = createSignal("")
    const [password, setPassword] = createSignal("")
    const [error, setError] = createSignal("")

    // when we set this up we need to start a promise to gather passkeys that are offered
    // This points out the case that we get a passkey that we don't know
    // in this case we still need to get the user name and password
    initPasskey(setError).then((ok)=>{
        console.log("passkey init", ok)
    })

    const submit = async (e: any) => {
        e.preventDefault()
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
                        <Username />
                        <Password />
                        <BlueButton >{ln().signin}</BlueButton>
                    </form></Show>

                    <button class='hidden' onClick={()=>openSecretDialog(true)}>get secret</button>
            </Center>
        </div>
}

function Register() {
    return <Page>
        <Title />
        <Body>Register</Body>
    </Page>
}

