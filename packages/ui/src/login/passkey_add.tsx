import { Icon } from "solid-heroicons";
import { key, user } from "solid-heroicons/solid";
import { Component, createEffect, createSignal, JSX, JSXElement, Match, onMount, Show, Switch } from "solid-js";
import { Center, BlueButton, LightButton } from "../lib/form";
import { Factor, factors, useLn } from "./passkey_i18n";
import { A } from "../layout/nav";
import { createWs } from "../lib/socket";
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
} from "@github/webauthn-json/browser-ponyfill";



// we need to async get the login choices, 
export interface LoginChoice {
    factor: string  // empty means we should ask to add mfa, none means just username/password
    phone?: string
    email?: string
    error?: string
}
// export const [loginChoice, setLoginChoice] = createSignal<LoginChoice | null>(null)

// // we don't know this until they enter user and password.
// export async function getLoginChoice(user: string, password: string) {
//     //const resp = await fetch("/api/login_choice")
//     //setLoginChoice(resp)
//     setLoginChoice({ factor: "", email: "jimh@datagrove.com", phone: "4843664923" })
// }


export const InputLabel = (props: any) => {
    return <div><label {...props} class="dark:text-neutral-400 text-neutral-600 block text-sm font-medium leading-6">{props.children}</label></div>
}
export const Input = (props: InputProps) => {
    return <div><input {...props}
        class="block mt-1 w-full rounded-md border-0 dark:bg-neutral-900 bg-neutral-100 py-1.5  shadow-sm ring-1 ring-inset dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 p-2" /></div>
}

type InputProps = JSX.HTMLAttributes<HTMLInputElement> & { placeholder?: string, autofocus?: boolean, name?: string, autocomplete?: string, type?: string, value?: string, id?: string, required?: boolean }
export const Username: Component<InputProps> = (props) => {
    const ln = useLn()

    return <div >
        <div class="flex items-center justify-between">
            <InputLabel for="username" >{ln().username}</InputLabel>
        </div>
        <div >
            <Input  {...props} placeholder={ln().enterUsername} autofocus id="username" name="username" type="text" autocomplete="username webauthn" />
        </div>
    </div>
}


export const Password: Component<InputProps & { required?: boolean }> = (props) => {
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
                <button tabindex='-1' onClick={toggle} class="font-semibold hover:underline text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">{hide() ? ln().show : ln().hide} {ln().password}</button>
            </div>
        </div>
        <div >
            <Input {...props} ref={el!} id="password" name="password" type={hide() ? "password" : "text"} autocomplete="current-password" placeholder={ln().enterPassword} />
        </div>
    </div>
}

export const EmailInput = (props: InputProps) => {
    const ln = useLn()
    return <div>
        <div class="flex items-center justify-between">
            <InputLabel for="username" >{ln().email}</InputLabel>
        </div>
        <div class="mt-2"><Input {...props} placeholder={ln().email}  autocomplete='email' /></div>
    </div>
}
export const PhoneInput = (props: InputProps) => {
    const ln = useLn()
    return <div>
        <div class="flex items-center justify-between">
            <InputLabel for="username" >{ln().phone}</InputLabel>
        </div>
        <div class="mt-2"><Input {...props} placeholder={ln().phone} autocomplete='phone' /></div>
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
    error: number,
    cookie: string,
    home: string,
}
export interface ChallengeNotify {
	challenge_type: number
	challenge_sent_to: string
	other_options: number
    login_info?: LoginInfo
}

// Needs to work like a dialog box opens when signals true, calls close when done.
export const GetSecret: Component<{
    when: () => boolean,
    validate: (secret: string) => Promise<boolean>,
    onClose: (ok: boolean) => void}> = (props) => {

    const ln = useLn()

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
interface Totp  {
    img: Uint8Array
    secret: string
}
export const AddPasskey: Component<{
    when: () => boolean, required?: boolean,
    onClose: (u: boolean) => void
    allow?: string[],
}> = (props) => {
    const ws = createWs()
    const ln = useLn()
    let btnSaveEl: HTMLButtonElement | null = null;
    let btnNot: HTMLButtonElement | null = null;
    const [more, setMore] = createSignal(false)
    const [factor, setFactor] = createSignal<number>(Factor.kPasskey)
    const [email, setEmail] = createSignal("")
    const [mobile, setMobile] = createSignal("")
    const [voice, setVoice ] = createSignal("")
    const [isOpenGetSecret, setIsOpenGetSecret] = createSignal(false)

    const [dataUrl, setDataUrl] = createSignal("")

    const fb = async () =>{
        const [img,e] =  await ws.rpce<Totp>("gettotp", {})
        if (e) {
            console.log(e)
            return
        }
         const bl = new Blob([img!.img], { type: 'image/png' });
         const reader = new FileReader();
         reader.readAsDataURL(bl);
         reader.onloadend = () => {
           const dataUrl = reader.result as string;       
           setDataUrl(dataUrl)
         }
    
    }
    // why do we need validate and close? Can't validate close?
    const validate = async (secret: string) => {
        // this must be a socket call
        const [log, e] = await ws.rpcje<LoginInfo>("addfactor2", { challenge: secret })
        if (e) {
            console.log(e)
            return false
        }
        // we don't need to set login information, we are already logged in
        //setLoginInfo(log)
        return true
    }
 

    createEffect(() => {
        if (props.when()) {
            console.log("open add passkey")
            btnSaveEl?.focus()
        }
    })

    const add = async () => {
        if (factor() == Factor.kPasskey || factor() == Factor.kPasskeyp) {
            const o = await ws.rpcj<any>("addpasskey", {})
            const cco = parseCreationOptionsFromJSON(o)
            const cred = await create(cco)
            const token = await ws.rpcj<any>("addpasskey2", cred.toJSON())
            props.onClose(true)
        } else {
            let v = ""
            switch(Number(factor())) {
            case Factor.kEmail:
                v = email()
                break
            case Factor.kMobile:
                v = mobile()
                break
            case Factor.kVoice:
                v = voice()
                break
            }
            // we need to test the method here.
            await ws.rpcje<string>("addfactor", {
                type: Number(factor()),
                value: v
            })

            setIsOpenGetSecret(true)
        }
    }

    // we just close and go on.
    const notNow = () => { props.onClose(false) }
    // here we have to save our choice to the database
    const notEver = async () => { 
        await ws.rpcje("addfactor", {
            type: Number(Factor.kNone),
        })

        props.onClose(false) 
    }

    const changeFactor = (e: any) => {
        setFactor(Number(e.target.value))
        if (factor()==Factor.kTotp && dataUrl()=="") {
            fb()
        }
    }
    const closeSecret = () =>{
        setIsOpenGetSecret(false)
        // this onclose should finalize the login
        props.onClose(true)
    }

    return <>
        <GetSecret when={isOpenGetSecret} onClose={closeSecret} validate={validate} />
        <Show when={props.when() && !isOpenGetSecret()}>
            <Dialog>
                <Center>
                    <DialogPage >
                        <Show when={more()}>
                            <div>
                            <InputLabel>Second Factor</InputLabel>
                            <div class='mt-2 text-black dark:text-white  rounded-md items-center '>
                                <select
                                    id='ln'
                                    value={factor()}
                                    aria-label="Select language"
                                    class='flex-1  rounded-md dark:bg-neutral-900 text-black dark:text-white '
                                    onChange={changeFactor}>
                                    {factors.map(([code, name]:[number,string]) => (
                                        <option value={code}>
                                            {name}&nbsp;&nbsp;&nbsp;
                                        </option>
                                    ))}
                                </select></div>
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
                            <Match when={factor() === Factor.kPasskey || factor() === Factor.kPasskeyp}>

                            </Match>
                            <Match when={factor() == Factor.kEmail}>
                                <EmailInput onInput={(e:any)=>setEmail(e.target.value)} />

                            </Match>
                            <Match when={factor() == Factor.kMobile}>
                                <PhoneInput  onInput={(e:any)=>setMobile(e.target.value)} />

                            </Match>
                            <Match when={factor() ==  Factor.kVoice}>
                                <PhoneInput  onInput={(e:any)=>setVoice(e.target.value)}/>

                            </Match>
                            <Match when={factor() == Factor.kTotp}>
                                <img src={dataUrl()} />

                            </Match>
                            <Match when={factor() == Factor.kApp}>
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

