import { Icon } from "solid-heroicons";
import { key } from "solid-heroicons/solid";
import { Component, createEffect, createSignal, JSX, JSXElement, Match, onMount, Show, Switch } from "solid-js";
import { Center, BlueButton, LightButton } from "../lib/form";
import { Factor, _, factors, useLn } from "./passkey_i18n";
import { createWs } from "../core/socket";
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
} from "@github/webauthn-json/browser-ponyfill";
import { Cell, CellOptions } from "../db/cell";
import { Ab, Bb } from "../layout/nav";
import { on } from "events";
import { FactorSettings } from "./settings";
import { Input, InputProps } from "../lib/input";
// type InputProps = JSX.HTMLAttributes<HTMLInputElement> & { placeholder?: string, autofocus?: boolean, name?: string, autocomplete?: string, type?: string, value?: string, id?: string, required?: boolean }

export const DirectiveText = (props: any) => {
    return <div class="dark:text-neutral-400 text-neutral-600 block text-sm font-medium leading-6">{props.children}</div>
}
export const InputLabel = (props: any) => {
    return <div><label {...props} class="dark:text-neutral-400 text-neutral-600 block text-sm font-medium leading-6">{props.children}</label></div>
}


// for 1199 I can create a password and send it.
export const user: CellOptions = {
    name: "username",
    autocomplete: "username webauthn",
    autofocus: true,
}
export const password: CellOptions = {
    name: "password",
    type: "password",
}
export const phone: CellOptions = {
    name: "phone",
}

export const email: CellOptions = {
    name: "email",
}

export const Username: Component<InputProps> = (props) => {
    const ln = useLn()

    return <div >
        <div class="flex items-center justify-between">
            <InputLabel for="username" >{ln().username}</InputLabel>
        </div>
        <div  >
            <Input {...props} placeholder={ln().enterUsername} id="username" name="username" type="text" autocomplete="username webauthn" />
        </div>

    </div>
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

export interface LoginInfo {
    home: string,
    email: string,
    phone: string,
    cookies: string[],
    options: number
}
export interface ChallengeNotify {
    challenge_type: number
    challenge_sent_to: string
    other_options: number
    login_info?: LoginInfo
}

// Needs to work like a dialog box opens when signals true, calls close when done.
export const GetSecret: Component<{
    validate: (secret: string) => Promise<boolean>,
    onClose: (ok: boolean) => void
}> = (props) => {
    const ln = useLn()
    const [error, setError] = createSignal("")
    const [inp, setInp] = createSignal("")

    const cancel = (e: any) => {
        e.preventDefault()
        props.onClose(false)
    }
    const submit = (e: any) => {
        e.preventDefault()
        props.validate(inp()).then(ok => {
            if (!ok) {
                setError(ln().invalidCode)
            } else {
                props.onClose(false)
            }
        })
    }
    return <Dialog>
        <DialogPage>
            <form onSubmit={submit} class='space-y-6'>
                <div>
                    <Show when={error()}><div class='text-red-500'>{error()}</div></Show>
                    <InputLabel>Enter code</InputLabel>
                    <InputSecret autofocus onInput={(e: any) => setInp(e.target.value)} />
                </div>
                <DialogActions><OkButton /> <CancelButton onClick={cancel} /></DialogActions>
            </form>
        </DialogPage></Dialog>
}

// onClose returns true if they added a passkey, false if they didn't
// no matter what they should be logged in.
// even if the add passkey fails, they should be logged in.
export enum PasskeyChoice {
    Add = 0,
    NotNow = 1,
    NotEver = 2,
}
export const AddPasskey: Component<{
    onClose: (u: PasskeyChoice, error: string) => void
    allow?: string[],
}> = (props) => {
    const ws = createWs()
    const ln = useLn()
    let btnSaveEl: HTMLButtonElement | null = null;
    let btnNot: HTMLButtonElement | null = null;

    const add = async () => {
        const o = await ws.rpcj<any>("addpasskey", {})
        const cco = parseCreationOptionsFromJSON(o)
        const cred = await create(cco)
        const [token, err] = await ws.rpcje<any>("addpasskey2", cred.toJSON())
        if (err) {
            props.onClose(PasskeyChoice.NotNow, err)
            return
        }
        props.onClose(PasskeyChoice.Add, "")
    }

    // we just close and go on.
    const notNow = () => {
        props.onClose(PasskeyChoice.NotNow, "")
    }
    // here we have to save our choice to the database
    const notEver = async () => {
        await ws.rpcje("addfactor", {
            type: Number(Factor.kNone),
        })

        props.onClose(PasskeyChoice.NotEver, "")
    }
    return <Dialog> <DialogPage >
        <div class="space-y-6 ">
            <Icon path={key} class="w-24 h-24 mx-auto" />
            <p >{ln().addPasskey1}</p>
            <p class='text-neutral-500'>{ln().addPasskey2}</p>
        </div>
        <div class='flex space-x-4'>
            <div class='w-24'><BlueButton autofocus tabindex='0' ref={btnSaveEl!} onClick={add}>{ln().add}</BlueButton></div>
            <div class='w-24'><LightButton tabindex='0' ref={btnNot!} onClick={notNow}>{ln().notNow}</LightButton></div>
            <div class='w-24'><LightButton tabindex='0' onClick={notEver}>{ln().notEver}</LightButton></div>
        </div>
        <div class=' flex'><Bb onClick={() => {
            //setMore(true)
        }}>{ln().more2fa}</Bb></div></DialogPage> </Dialog>
}


/*

<select
                                        id='ln'
                                        value={factor()}
                                        aria-label="Select language"
                                        class='flex-1  rounded-md dark:bg-neutral-900 text-black dark:text-white '
                                        onChange={changeFactor}>
                                        {factors.map(([code, name]: [number, string]) => (
                                            <option value={code}>
                                                {name}&nbsp;&nbsp;&nbsp;
                                            </option>
                                        ))}
                                    </select>
*/