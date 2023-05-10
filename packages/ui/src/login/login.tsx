
import { H2, SimplePage } from "..";
import { Component, JSX, Match, Show, Switch, createEffect, createSignal } from "solid-js";
import { Factor, useLn } from "./passkey_i18n";
import { BlueButton } from "../lib/form";
import { Username, Password, AddPasskey, GetSecret, ChallengeNotify, LoginInfo } from "./passkey_add";
import { abortController, initPasskey, webauthnLogin } from "./passkey";
import { createWs } from "../core/socket";
import { A, useNavigate } from "../core/dg";
// instead of localstorage, why not cookies?
// cookies are less convenient for webrtc
// websockets can use them though.

// token per container? per home containers? can you have more than one home though?
export interface Sec {
    token: {
        [key: string]: Token
    }
}
export interface Token {
    resource: string
    signed: string
    expires: number
}

export const [sec, setSec_] = createSignal<Sec>({
    token: {}
})
window.addEventListener("storage", () => {
    // When local storage changes, dump the list to
    // the console.
    const sec = localStorage.getItem("sec")
    const o = sec ? JSON.parse(sec) as Sec : { token: {} } as Sec
    setSec_(o)
});
export const setLogin = (sec: Sec) => {
    localStorage.setItem("sec", JSON.stringify(sec))
    setSec_(sec)
}
export const useLogin = () => () => sec().token["~"]
export interface Loc {
    // org-container.server.domain/#/tab/page when published (iframes)
    // but server.dns alone, building anonymous iframes is potentially more powerful
    org: string
    container: string
    tab: string,
    page: string[]
}

// when this page logs in successfully, how do we get the user to the right place?
export const Spc = () => <div class='flex-1' />
type ButtonProps = JSX.HTMLAttributes<HTMLButtonElement>

export const GreyButton: Component<ButtonProps> = (props) => {
    return <button {...props} class="text-sm block font-semibold hover:underline text-indigo-500 hover:text-indigo-700 dark:text-neutral-500 dark:hover:text-indigo-300">
        {props.children}
    </button>
}

// when using hashes, we need to adjust the path according to the hash.
export const Ag: Component<any> = (props) => {
    return <A {...props} class="text-sm block font-semibold hover:underline text-indigo-500 hover:text-indigo-700 dark:text-neutral-500 dark:hover:text-indigo-300">
        {props.children}
    </A>
}




export interface LoginProps {
    createAccount?: string
    recoverUser?: string
    recoverPassword?: string
    afterLogin?: string
}
export const LoginPage: Component<LoginProps> = (props) => {
    const [suspense, Suspense] = createSignal(false)
    const finishLogin = (i: LoginInfo) => {

        i.cookies.forEach((c) => {
            document.cookie = c + ";path=/"
        })

        //location.href = i.home
        // we can't nav here because it may go to a different page
        // this will force a reload, so maybe w
        const h = i.home ? i.home : props.afterLogin ?? "/"
        location.href = h
        // nav(h)
        //window.open(i.home, "_blank")
        //console.log("login info", i)
    }
    return <SimplePage>
        <Login {...props} finishLogin={finishLogin}/>
        </SimplePage>
}
// todo: send language in requests so that we can localize the error messages

// If we are in another tab we might need to connect, maybe connect automatically?
// maybe send the user secret with the submit?
export const [loginInfo, setLoginInfo] = createSignal<LoginInfo | undefined>(undefined)

interface LoginProps2 extends LoginProps {
    finishLogin: (i: LoginInfo) => void
}
export const Login: Component<LoginProps2> = (props) => {
    enum Screen {
        Login,
        Secret,
        AddKey,
        Suspense
    }
    const ws = createWs()
    const ln = useLn()
    const nav = useNavigate()

    const [user, setUser] = createSignal("")
    const [password, setPassword] = createSignal("")
    const [error, setError_] = createSignal("")
    const [screen, setScreen_] = createSignal(Screen.Login)

    createEffect(() => {
        console.log("screen", screen())
    })
    const setError = (e: string) => {
        setScreen(Screen.Login)
        setError_((ln() as any)[e] ?? e)
    }
    // when we set this up we need to start a promise to gather passkeys that are offered
    // This points out the case that we get a passkey that we don't know
    // in this case we still need to get the user name and password
    const init = async () => {
        try {
            const i = await initPasskey()
            if (i) {
                finishLogin(i)
            }
            else console.log("passkey watch cancelled")
        }
        catch(e){
            setError(e+"")
        }
    }
    init()

    // we need to abort the wait before we can register a new key.
    const setScreen = (r: Screen) => {
        if (r == Screen.Login) {
            init()
        }
        setScreen_(r)
    }

    const finishLogin = (i: LoginInfo) => {
        props.finishLogin(i)
    }

    // we might nag them here to add a second factor, or even require it.
    // if they send a password, but require a passkey, we need to trigger that
    // if they give a passkey, but we need a password anyway, we need to handle that.
    // we can't easily not advertise passkey, because don't know who will log in.
    const submitLogin = async (e: any) => {
        e.preventDefault()
        // we clicked submit, so not a passkey. We need to check the login and potentially ask for second factor
        setScreen(Screen.Suspense)
        let [ch, err] = await ws.rpcje<ChallengeNotify>("loginpassword", { username: user(), password: password() })
        console.log("loginpassword", ch, err)
        if (err) {
            setError(err)
            return
        }
        ch = ch!
        abortController.abort()
        // if the challenge type is 0 then we would ask for a second factor
        const typ = ch?.challenge_type ?? 0
        switch (typ) {
            case 0:
                // we are logged in, but we should ask for a second factor
                setScreen(Screen.AddKey)// we need to add a passkey
                setLoginInfo(ch?.login_info)
                break
            case Factor.kPasskey:
            case Factor.kPasskeyp:
                const li = await webauthnLogin()
                finishLogin(li)
                break
            case Factor.kNone:
                // we must have login here, because if we didn't we would have gotten an error
                finishLogin(ch.login_info!)
                break
            default:
                setScreen(Screen.Secret)
        }
    }
    // called when the user has confirmed the secret or has given up
    const confirmSecret = (ok: boolean) => {
        // either way we close the dialog
        if (ok) {
            setScreen(Screen.Login)
            if (!loginInfo()) {
                setError("challenge failed")
            } else {
                finishLogin(loginInfo()!)
            }
        }
    }

    const onCloseAddKey = (e: any) => {
        console.log("closed passkey dialog")
        setScreen(Screen.Login)
        // we must have login info here, or we wouldn't be asking to add a passkey
        finishLogin(loginInfo()!)
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
    return <div >
        <Switch>
            <Match when={screen() == Screen.AddKey}><AddPasskey onClose={onCloseAddKey} /></Match>
            <Match when={screen() == Screen.Secret}><GetSecret validate={validate} onClose={confirmSecret} /></Match>
            <Match when={screen() == Screen.Suspense}>
                <H2>Loading...</H2>
                <pre class='hidden'>{JSON.stringify(loginInfo(), null, 2)}</pre>
            </Match>
            <Match when={screen() == Screen.Login}>
                <form method='post' class='space-y-6' onSubmit={submitLogin} >
                    <Show when={error()}> <div>{error()}</div></Show>
                    <Username autofocus onInput={(e: string) => setUser(e)} />
                    <Password onInput={(e: string) => setPassword(e)} />
                    <BlueButton  >{ln().signin}</BlueButton>
                </form>

                <div class="mt-6 space-y-4">
                    <Show when={props.createAccount}>
                        <div class='flex'><Spc />
                            <Ag href={props.createAccount ?? "/register"}>{ln().register}</Ag><Spc /></div></Show>

                    <Show when={props.recoverPassword}><div class="flex"><Spc />
                        <Ag href={props.recoverPassword!}>{ln().forgotPassword}</Ag>
                        <Spc /></div></Show>
                    <Show when={props.recoverUser}><div class="flex"><Spc />
                        <Ag href={props.recoverUser!}>{ln().forgotUsername}</Ag>
                        <Spc /></div></Show>
                </div></Match>
        </Switch>

    </div>
}

