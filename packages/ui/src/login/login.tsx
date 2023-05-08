
import { Ab, Center, H2, SimplePage } from "..";
import { Component, JSX, Match, Show, Switch, createSignal } from "solid-js";
import { Factor, useLn } from "./passkey_i18n";
import { BlueButton } from "../lib/form";
import { Username, Password, AddPasskey, EmailInput, GetSecret, PhoneInput, ChallengeNotify, LoginInfo, InputCell, PasswordCell } from "./passkey_add";
import { abortController, initPasskey, webauthnLogin } from "./passkey";
import { createWs } from "../core/socket";
import { Segment } from "../lib/progress";
import { CellOptions, cell } from "../db/client";
import { useNavigate } from "../core/dg";

// when this page logs in successfully, how do we get the user to the right place?
export const Spc = () => <div class='flex-1' />
type ButtonProps = JSX.HTMLAttributes<HTMLButtonElement>

export const GreyButton: Component<ButtonProps> = (props) => {
    return <button {...props} class="text-sm block font-semibold hover:underline text-indigo-500 hover:text-indigo-700 dark:text-neutral-500 dark:hover:text-indigo-300">
        {props.children}
    </button>
}


export interface LoginProps {
    createAccount?:  string
    restoreAccount?: string
}
export const LoginPage : Component<LoginProps> = (props) => {
    return <SimplePage>{Login(props)}</SimplePage>
}
// todo: send language in requests so that we can localize the error messages

const Login: Component<LoginProps> = (props) => {

    enum Screen {
        Login,
        Secret,
        AddKey,
        Suspense
    }
    const ws = createWs()
    const ln = useLn()
    const nav = useNavigate()

    // replace with cells
    const [user, setUser] = createSignal("")
    const [password, setPassword] = createSignal("")


    const [error, setError_] = createSignal("")
    const [screen, setScreen_] = createSignal(Screen.Login)
    const [email, setEmail] = createSignal("")
    const [phone, setPhone] = createSignal("")

    const [secret, setSecret] = createSignal("")

    const [loginInfo, setLoginInfo] = createSignal<LoginInfo | undefined>(undefined)
    const setError = (e: string) => {
        setError_((ln() as any)[e] ?? e)
    }

    const [finished, setFinished] = createSignal(false)

    const finishLogin = (i: LoginInfo ) => {
        setScreen(Screen.Suspense)
        loginInfo()?.cookies.forEach((c) => {
            document.cookie = c + ";path=/"
        })
        location.href = i.home
        //setFinished(true)
    }

    // we need to abort the wait before we can register a new key.
    const setScreen = (r: Screen) => {
        if (r == Screen.Login) {
            initPasskey(setError)
        }
        setScreen_(r)
    }

    // when we set this up we need to start a promise to gather passkeys that are offered
    // This points out the case that we get a passkey that we don't know
    // in this case we still need to get the user name and password
    initPasskey(setError).then((i: LoginInfo|null ) => {
        if (i) finishLogin(i)
        else console.log("passkey watch cancelled")
    })


    // we might nag them here to add a second factor, or even require it.
    // if they send a password, but require a passkey, we need to trigger that
    // if they give a passkey, but we need a password anyway, we need to handle that.
    // we can't easily not advertise passkey, because don't know who will log in.
    const submitLogin = async (e: any) => {
        e.preventDefault()
        // we clicked submit, so not a passkey. We need to check the login and potentially ask for second factor
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
    const onCloseAddKey = (e: any) => {
        console.log("closed passkey dialog")
        setScreen(Screen.Login)
        // we must have login info here, or we wouldn't be asking to add a passkey
        finishLogin(loginInfo()!)
    }

    // called when the user has confirmed the secret or has given up
    const confirmSecret = (ok: boolean) => {
        // either way we close the dialog
        if (ok) {
            setScreen(Screen.Login)
            if (!loginInfo()){
                setError("challenge failed")
            } else {
                finishLogin(loginInfo()!)
            }
        }
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

    return <div dir={ln().dir}>
        <Show when={finished()}>
            <Center>
                <div><Ab href={loginInfo()?.home ?? ""}>Home</Ab></div>
                <div>{JSON.stringify(loginInfo(), null, 4)}</div></Center>

        </Show>
        <Show when={!finished()}>
            <AddPasskey when={() => screen() == Screen.AddKey} onClose={onCloseAddKey} />
            <GetSecret validate={validate} when={() => screen() == Screen.Secret} onClose={confirmSecret} />

            <Switch>
                <Match when={screen() == Screen.Suspense}>
                    <H2>Loading...</H2>
                    <pre class='hidden'>{JSON.stringify(loginInfo(),null,2)}</pre>
                    </Match>
                <Match when={screen() == Screen.Login}>
                    <form method='post' class='space-y-6' onSubmit={submitLogin} >
                        <Show when={error()}> <div>{error()}</div></Show>
                        <Username autofocus ref={el!} onInput={(e: string) => setUser(e)} />
                        <Password onInput={(e: string) => setPassword(e)} />
                        <BlueButton  >{ln().signin}</BlueButton>
                    </form>
                    <div class="mt-6 space-y-4">
                        <div class='flex'><Spc /><GreyButton onClick={()=>{
                            if (props.createAccount) {
                                location.href = props.createAccount
                            } else {
                                nav('register') // relative to the current page
                            }
                            }}>{ln().register}</GreyButton><Spc /></div>

                        <div class="flex"><Spc />
                            <GreyButton onClick={() => { 
                                nav('recover')
                                }}>{ln().forgotPassword}</GreyButton>
                            <Spc /></div>
                    </div></Match>
            </Switch>
        </Show>
    </div>
}

