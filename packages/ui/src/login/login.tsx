
import { Ab, Center, SimplePage } from "..";
import { Component, JSX, Match, Show, Switch, createSignal } from "solid-js";
import { Factor, useLn } from "./passkey_i18n";
import { BlueButton } from "../lib/form";
import { Username, Password, AddPasskey, EmailInput, GetSecret, PhoneInput, ChallengeNotify, LoginInfo, InputCell, PasswordCell } from "./passkey_add";
import { abortController, initPasskey, webauthnLogin } from "./passkey";
import { createWs } from "../db/socket";
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

export interface AuthPolicy {
    uniqueName: boolean
    require: string[]
}
enum Screen {
    Login,
    Secret,
    AddKey,
    Recover,
    Recover2
}

const keys = ["passkey", "email", "phone", "time", "app"]
export const LoginPagex: Component<{}> = (props) => {
    const [key, setKey] = createSignal("passkey")
    return <Center>
        <Segment option={keys} value={key} onChange={setKey} />
    </Center>
}

export const LoginPage = (props: { allow?: string[] }) => {
    return <SimplePage><Login /></SimplePage>
}


// todo: send language in requests so that we can localize the error messages
const Login: Component<{ allow?: string[] }> = (props) => {
    const ws = createWs()
    const ln = useLn()
    const nav = useNavigate()

    const [user, setUser] = createSignal("")
    const [password, setPassword] = createSignal("")
    const [error, setError_] = createSignal("")
    const [screen, setScreen_] = createSignal(Screen.Login)
    const [email, setEmail] = createSignal("")
    const [phone, setPhone] = createSignal("")

    const [secret, setSecret] = createSignal("")

    const [loginInfo, setLoginInfo] = createSignal<LoginInfo | undefined | null>(undefined)
    const setError = (e: string) => {
        setError_((ln() as any)[e] ?? e)
    }

    const [finished, setFinished] = createSignal(false)

    const finishLogin = (i: LoginInfo | null | undefined) => {
        console.log("finish login", i)
        setLoginInfo(i)
        if (i) {
            loginInfo()?.cookies.forEach((c) => {
                document.cookie = c + ";path=/"
            })
            location.href = i.home
            //setFinished(true)
        }
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
    initPasskey(setError).then((i: LoginInfo | null) => {
        finishLogin(i)
    })


    // we might nag them here to add a second factor, or even require it.
    // if they send a password, but require a passkey, we need to trigger that
    // if they give a passkey, but we need a password anyway, we need to handle that.
    // we can't easily not advertise passkey, because don't know who will log in.
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

    const recover = async () => {
        const o = await ws.rpcj("recover", { email: email(), phone: phone() })
        setScreen(Screen.Recover2)
    }
    const recover2 = async () => {
        const o = await ws.rpcj("recover2", { secret: secret() })
        setScreen(Screen.Recover2)
    }

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

                <Match when={screen() == Screen.Login}>
                    <form method='post' class='space-y-6' onSubmit={submitLogin} >
                        <Show when={error()}> <div>{error()}</div></Show>
                        <Username ref={el!} onInput={(e: any) => setUser(e.target.value)} />
                        <Password onInput={(e: any) => setPassword(e.target.value)} />
                        <BlueButton  >{ln().signin}</BlueButton>
                    </form>
                    <div class="mt-6 space-y-4">
                        <div class='flex'><Spc /><GreyButton onClick={() => { nav('/register') }}>{ln().register}</GreyButton><Spc /></div>

                        <div class="flex"><Spc />
                            <GreyButton onClick={() => { nav('/register') }}>{ln().forgotPassword}</GreyButton>
                            <Spc /></div>
                    </div></Match>
                <Match when={screen() == Screen.Recover}>
                    <form method='post' class='space-y-6' onSubmit={submitLogin} >
                        <div>Enter phone or email</div>
                        <PhoneInput onInput={setPhone} />
                        <EmailInput onInput={setEmail} />
                        <BlueButton onClick={recover} >{ln().recover}</BlueButton>
                    </form>
                </Match>
                <Match when={screen() == Screen.Recover2}>
                    <form method='post' class='space-y-6' onSubmit={submitLogin} >
                        <div>Choose a new password </div>
                        <Username onInput={setUser}></Username>
                        <Password onInput={setPassword} />
                        <BlueButton onClick={recover2} >{ln().recover}</BlueButton>
                    </form>
                </Match>
                <Match when={true}>
                    <div>Bad screen {screen()} </div>
                </Match>


            </Switch>
        </Show>
    </div>
}

// inviting is a way to send a link with a OTP to someone to join the system
// could be email or internal name.
// name.namespace vs name@dns
export const InvitePage = () => {

}

// for imis we should try to intercept the registration and just steal the password if it succeeds.
// for 1199 we don't need registration at all; just a QR code for pat?
// how does pat grant then?
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
    const submitRegister = async (eb: any) => {
        // we need to check if the name is available
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
        <BlueButton disabled={!data.user.value()} >{ln().register}</BlueButton>
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
