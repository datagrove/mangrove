import { Icon } from "solid-heroicons";
import { key } from "solid-heroicons/solid";
import { Component, createEffect, createSignal, JSXElement, Match, onMount, Show, Switch } from "solid-js";
import { Center, BlueButton, LightButton } from "../lib/form";
import { factors, useLn } from "./passkey_i18n";
import { A } from "../layout/nav";

// we need to async get the login choices, 
export interface LoginChoice {
    factor: string  // empty means we should ask to add mfa, none means just username/password
    phone?: string
    email?: string
    error?: string
}
export const [loginChoice, setLoginChoice] = createSignal<LoginChoice | null>(null)

// we don't know this until they enter user and password.
export async function getLoginChoice(user: string, password: string) {
    //const resp = await fetch("/api/login_choice")
    //setLoginChoice(resp)
    setLoginChoice({ factor: "", email: "jimh@datagrove.com", phone: "4843664923" })
}

export interface UserMfa {

}
export const InputLabel = (props: any) => {
    return <div><label {...props} class="dark:text-neutral-400 text-neutral-600 block text-sm font-medium leading-6">{props.children}</label></div>
}
export const Input = (props: any) => {
    return <div><input {...props} class="block p-2 mt-2 w-full rounded-md border-0 dark:bg-neutral-900 bg-neutral-100 py-1.5  shadow-sm ring-1 ring-inset dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" /></div>
}
export const EmailInput = (props: any) => {
    return <Input placeholder='email' value={loginChoice()?.email ?? ""} />
}
export const PhoneInput = (props: any) => {
    return <Input placeholder='phone' value={loginChoice()?.phone ?? ""} />
}
export const InputSecret = (props: any) => {
    return <Input {...props} placeholder='code' />
}
export const TotpInput = (props: any) => {
    return <img src='/qrcode.png' />
}
export const CancelButton = (props: any) => {
    return <div class='w-24'><LightButton {...props}  >Cancel</LightButton></div>
}
export const OkButton = (props: any) => {
    return <div class='w-24'><BlueButton {...props}  >OK</BlueButton></div>
}
export const SendButton = (props: any) => {
    return <div class='w-24'> <BlueButton>Send</BlueButton></div>
}
export const Dialog: Component<{ children: JSXElement }> = (props) => {
    // this is full page overlay
    return <div
        class="fixed  inset-0 bg-gray-600 bg-opacity-0 overflow-y-auto h-full w-full"
        id="my-modal"
        //onClick={() => props.onChange({})}
        role="presentation"
    >
        <Center>
            {props.children}
        </Center>
    </div>
}
export const DialogPage: Component<any> = (props) => {
    return <div class="mx-auto p-5 space-y-6 border w-96 shadow-lg rounded-md dark:bg-black bg-white h-1/2">{props.children}</div>
}
export const DialogActions: Component<any> = (props) => {
    return <div class='flex space-x-2'>{props.children}</div>
}

export const GetSecret: Component<{
    when: () => boolean,
    validate: (secret: string) => Promise<boolean>,
    onChange: (ok: boolean) => void
}> = (props) => {
    const [error, setError] = createSignal("")
    let btn: HTMLButtonElement | null = null;
    const [inp, setInp] = createSignal("")
    createEffect(() => {
        if (props.when()) {
            btn?.focus()
        }
    })

    const cancel = (e: any) => {
        e.preventDefault()
        props.onChange(false)
    }
    const submit = (e: any) => {
        e.preventDefault()
        props.validate(inp()).then(ok => {
            if (!ok) {
                setError("Invalid code.")
            } else {
                props.onChange(true)
            }
        })
    }
    return <>
        <Show when={props.when()} >
            <Dialog>
                <DialogPage>
                    <form onSubmit={submit} class='space-y-6'>
                        <div>
                            <Show when={error()}><div class='text-red-500'>{error()}</div></Show>
                            <InputLabel>Enter code</InputLabel>
                            <InputSecret ref={btn!} onInput={(e: any) => setInp(e.target.value)} />
                        </div>
                        <DialogActions><OkButton /> <CancelButton onClick={cancel} /></DialogActions>
                    </form>
                </DialogPage></Dialog>
        </Show >
    </>
}

export const AddPasskey: Component<{ when: () => boolean, required?: boolean, onChange: (u: UserMfa) => void }> = (props) => {
    const ln = useLn()
    let btnSaveEl: HTMLButtonElement | null = null;
    let btnNot: HTMLButtonElement | null = null;
    const [more, setMore] = createSignal(false)
    const [factor, setFactor] = createSignal("passkey")
    let secret = "1234"
    const [open, setOpen] = createSignal(false)

    createEffect(() => {
        if (props.when()) {
            btnSaveEl?.focus()
        }
    })

    const add = () => {
        if (factor() == "passkey" || factor() == "passkey+") {
        } else {
            setOpen(true)
        }
    }
    const notNow = () => { props.onChange({}) }
    const notEver = () => { props.onChange({}) }

    const changeFactor = (e: any) => {
        setFactor(e.target.value)
    }
    const validate = async (secret: string) => {
        return secret == "1234"
    }
    return <>
        <GetSecret when={open} onChange={setOpen} validate={validate} />
        <Show when={props.when() && !open()}>
            <Dialog>
                <Center>
                    <DialogPage >
                        <Show when={more()}>
                            <div class=' text-black dark:text-white  rounded-md items-center space-x-2'>
                                <select
                                    id='ln'
                                    value="passkey"
                                    aria-label="Select language"
                                    class='flex-1  rounded-md dark:bg-neutral-900 text-black dark:text-white '
                                    onChange={changeFactor}>
                                    {factors.map(([code, name]) => (
                                        <option value={code}>
                                            {name}&nbsp;&nbsp;&nbsp;
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </Show>
                        <Switch>
                            <Match when={!more()}>
                                <div class="space-y-6 ">
                                    <Icon path={key} class="w-24 h-24 mx-auto" />
                                    <p >{ln().addPasskey1}</p>
                                    <p class='text-neutral-500'>{ln().addPasskey2}</p>
                                </div>
                            </Match>
                            <Match when={factor() === "passkey" || factor() === "passkey+"}>

                            </Match>
                            <Match when={factor() == "email"}>
                                <EmailInput />

                            </Match>
                            <Match when={factor() == "sms"}>
                                <PhoneInput />

                            </Match>
                            <Match when={factor() == "voice"}>
                                <PhoneInput />

                            </Match>
                            <Match when={factor() == "totp"}>
                                <img src='/qr.png' />

                            </Match>
                            <Match when={factor() == "app"}>
                                <div> Install iMis on your phone</div>
                            </Match>
                        </Switch>
                        <div class='flex space-x-4'>
                            <div class='w-24'><BlueButton tabindex='0' ref={btnSaveEl!} onClick={add}>{ln().add}</BlueButton></div>
                            <div class='w-24'><LightButton tabindex='0' ref={btnNot!} onClick={notNow}>{ln().notNow}</LightButton></div>
                            <div class='w-24'><LightButton tabindex='0' onClick={notEver}>{ln().notEver}</LightButton></div>
                        </div>
                        <Show when={!more()}><div class=' flex'><A href='#' onClick={() => setMore(true)}>{ln().more2fa}</A></div></Show>
                    </DialogPage></Center>
            </Dialog ></Show >
    </>

};

