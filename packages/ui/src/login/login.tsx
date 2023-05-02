
import { Body, Center, Page, Title } from "..";
import { Component, JSX, Show, createSignal } from "solid-js";
import { Factor, useLn } from "./passkey_i18n";
import { DarkButton } from "../layout/site_menu";
import { BlueButton } from "../lib/form";
import { Username, Password, AddPasskey, EmailInput, GetSecret, Input, InputLabel, PhoneInput, ChallengeNotify, LoginInfo } from "./passkey_add";
import { LanguageSelect } from "../i18n/i18";
import { abortController, initPasskey } from "./passkey";
import { createWs } from "../lib/socket";
import { A } from "../layout/nav";
import { setLogin } from "../lib/crypto";

// when this page logs in successfully, how do we get the user to the right place?

enum Screen {
    Login,
    Register,
    Secret,
    AddKey,
}

// todo: send language in requests so that we can localize the error messages
export const LoginPage: Component<{ allow?: string[] }> = (props) => {
    const ws = createWs()
    const ln = useLn()

    const [user, setUser_] = createSignal("")
    const [password, setPassword] = createSignal("")
    const [error, setError_] = createSignal("")
    const [screen, setScreen_] = createSignal(Screen.Login)
    const register = () => screen() == Screen.Register

    const [loginInfo, setLoginInfo] = createSignal<LoginInfo | undefined>(undefined)
    const setError = (e: string) => {
        setError_((ln() as any)[e] ?? e)
    }
    const [okname, setOkname] = createSignal(false)
    const [finished, setFinished] = createSignal(false)

    const finishLogin = (i: LoginInfo|null|undefined) => {
        console.log("finish login", i)
        if (i) {
            //location.href = i.home
            setFinished(true)
        }
    }

    // we need to abort the wait before we can register a new key.
    const setScreen = (r: Screen) => {
        if (r == Screen.Login) {
            initPasskey(setError)
        }
        setScreen_(r)
    }
    const setUser = async (u: string) => {
        if (register()) {
            // we need to check if the name is available
            const [ok, e] = await ws.rpcje<boolean>("okname", { name: u })
            if (!e && ok) {
                setOkname(true)
            } else {
                setOkname(false)
            }
        }
        setUser_(u)
    }
    // when we set this up we need to start a promise to gather passkeys that are offered
    // This points out the case that we get a passkey that we don't know
    // in this case we still need to get the user name and password
    initPasskey(setError).then((i: LoginInfo|null) => {
        finishLogin(i)
    })

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

    // we might nag them here to add a second factor, or even require it.
    const submitLogin = async (e: any) => {
        e.preventDefault()
        // we clicked submit, so not a passkey. We need to check the login and potentially ask for second factor
        const [ch, err] = await ws.rpcje<ChallengeNotify>("loginpassword", { username: user(), password: password() })
        console.log("loginpassword", ch, err)
        if (err) {
            setError(err)
            return
        }
        abortController.abort()
        // if the challenge type is 0 then we would ask for a second factor
        const typ = ch?.challenge_type??0
        switch(typ) {
            case 0:
                // we are logged in, but we should ask for a second factor
                setScreen(Screen.AddKey)// we need to add a passkey
                setLoginInfo(ch?.login_info)
            break
            case Factor.kNone:
                finishLogin(ch?.login_info)
                break
            default:
                setScreen(Screen.Secret)
        }
    }
    const onCloseAddKey = (e: any) => {
        console.log("closed passkey dialog")
        setScreen(Screen.Login)
        finishLogin(loginInfo())
    }

    // called when the user has confirmed the secret or has given up
    const confirmSecret = (ok: boolean) => {
        // either way we close the dialog
        setScreen(Screen.Login)
        finishLogin(loginInfo())
    }
    const validate = async (secret: string) => {
        // this must be a socket call
        const [log, e] = await ws.rpcje<LoginInfo>("loginpassword2", { challenge: secret })
        if (e) {
            setError(e)
            return false
        }
        setLoginInfo(log)
        return true
    }
    let el: HTMLInputElement
    const startRegister = () => {
        setScreen(Screen.Register)
        el.focus()
    }
    return <div dir={ln().dir}>
        <Show when={finished()}>
            <Center><pre>{JSON.stringify(loginInfo())}</pre></Center>
        </Show>
        <Show when={!finished()}>
        <AddPasskey when={() => screen() == Screen.AddKey} onClose={onCloseAddKey} />
        <GetSecret validate={validate} when={() => screen() == Screen.Secret} onClose={confirmSecret} />
        <div class='fixed w-screen flex flex-row items-center pr-4'>
            <div class='flex-1' />
            <div class='w-48'><LanguageSelect /></div>
            <DarkButton /></div>
        <Center>
            <Show when={register()}>
                <form method='post' class='space-y-6' onSubmit={submitRegister} >
                    <Username ref={el!} onInput={(e: any) => setUser(e.target.value)} />
                    <Show when={user()}><div>{user()} is {okname() ? "" : "not"} available</div></Show>
                    <Password onInput={(e: any) => setPassword(e.target.value)} />
                    <BlueButton disabled={register() && !okname()} >{ln().register}</BlueButton>
                </form>
            </Show>
            <Show when={screen() == Screen.Login}>
                <form method='post' class='space-y-6' onSubmit={submitLogin} >
                    <Show when={error()}> <div>{error()}</div></Show>
                    <Username ref={el!} onInput={(e: any) => setUser(e.target.value)} />
                    <Password onInput={(e: any) => setPassword(e.target.value)} />
                    <BlueButton  >{ln().signin}</BlueButton>
                </form></Show>

            <div class='mt-2'><A href='#' onClick={startRegister}>{register() ? "Cancel" : "Register"}</A></div>
        </Center>
        </Show>
    </div>
}



function Register() {
    return <Page>
        <Title />
        <Body>Register</Body>
    </Page>
}

