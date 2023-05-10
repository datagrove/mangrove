import { Component, JSX, JSXElement, Match, Show, Switch, children, createSignal } from "solid-js"
import { BlueButton, Center, LightButton } from "../lib/form"
import { AddPasskey, Dialog, DialogPage, EmailInput, GetSecret, Input, InputLabel, LoginInfo, PhoneInput, Username } from "./passkey_add"
import { Bb, H2, SimplePage } from "../layout/nav"
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
} from "@github/webauthn-json/browser-ponyfill";

import { Icon } from "solid-heroicons";
import { key } from "solid-heroicons/solid";
import { addMock, createWs } from "../core/socket";
import { useLn, Factor, factors } from "./passkey_i18n";
import { Disclosure, DisclosureButton, DisclosurePanel } from "solid-headless";
import { Login, LoginPage, loginInfo } from "./login";
import { A, useNavigate } from "../core/dg";


function ChevronUpIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 15l7-7 7 7"
            />
        </svg>
    );
}
const Db = (props: { children: JSX.Element }) => {
    return <DisclosureButton as="div" class="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-neutral-900 bg-neutral-100 rounded-lg hover:bg-neutral-200 focus:outline-none focus-visible:ring focus-visible:ring-neutral-500 focus-visible:ring-opacity-75">
        {({ isOpen }) => (
            <>
                {props.children}
                <ChevronUpIcon
                    class={`${isOpen() ? 'transform rotate-180' : ''} w-5 h-5 text-neutral-500`}
                />
            </>
        )}
    </DisclosureButton>
}
const Dp = (props: { children: JSX.Element }) => {
    return <DisclosurePanel class="px-2 mt-2 pt-2 space-y-2  text-sm text-gray-500">
        {props.children}
    </DisclosurePanel>
}

const ButtonSet = (props: { children: JSX.Element[] }) => {
    return <div class='flex space-x-4'>
        {props.children}
    </div>
}
interface ButtonProps {
    autofocus?: boolean
    onClick: () => void
    children: JSX.Element
}
const Bs1 = (props: ButtonProps) => {
    return <div class='w-24'><BlueButton {...props}/></div>
}
const Bs = (props: ButtonProps) => {
    return <div class='w-24'><LightButton {...props} /></div>
}

// we should have loginInfo here, since we must be logged in for this to make sense.
// but we could have moved away from the page, so we need to use the login cookie or similar to restore the login info. We can keep everything in sessionStorage? It depends on how we want to manage logins, if we want to log back in without challenge then we need to keep in localStorage.

// must use cbor to get uint8array

// first we need to login, then we can change the settings
// save goes back to the logout state

export const SettingsPage: Component<{}> = (props) => {
    const [ loggedin, setLoggedin ] = createSignal(false)

    const finishLogin = (l: LoginInfo) => {
        setLoggedin(true)
    }
    return <SimplePage>
        <Switch>
            <Match when={loggedin()}>
                <FactorSettings onClose={() => { }} />
            </Match>
            <Match when={true}>
                <H2 class='mb-2'>Change Security Settings</H2>
                <P class='mb-4'>First Login in with your existing settings</P>
                 <Login finishLogin={finishLogin} />
            </Match>
        </Switch>
    </SimplePage>
}



export interface Settings {
    user_secret: string
    img: Uint8Array | undefined
    email: string
    phone: string
    activate_passkey: boolean
    activate_totp: boolean
    activate_app: boolean
}
const P = (props: { children: JSX.Element, class?: string }) => {
    return <p class={`dark:text-neutral-400 ${props.class} `}>{props.children} </p>
}
const InputButton = (props: { 
        onClick: () => void, 
        buttonLabel?: string,
        children: JSX.Element 
        }) => {
    return <div class='w-full flex items-center space-x-2 '>
    <div class='flex-1'>
        {props.children}</div>
    <div class='w-16'><LightButton onClick={props.onClick}>{props.buttonLabel??"Test"}</LightButton></div></div>
        }


export const FactorSettings: Component<{ onClose: (x: boolean) => void }> = (props) => {
    const ws = createWs()

    const ln = useLn()
    const nav = useNavigate()
    const [settings, setSettings] = createSignal<Settings | undefined>()
    const [dataUrl, setDataUrl] = createSignal<string>("")
    const [code,setCode] = createSignal("")
    const [voice,setVoice] = createSignal(false)
    // we should use a resource like thing to get the current settings using the secret that's in the login info.

    const fb = async () => {
        const [settings, e] = await ws.rpce<Settings>("settings", {})
        console.log("settings", settings)
        if (e) {
            return
        }
        setSettings(settings)
        const bl = new Blob([settings!.img!], { type: 'image/png' });
        const reader = new FileReader();
        reader.readAsDataURL(bl);
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setDataUrl(dataUrl)
        }
    }
    fb()

    const save = async () => {
        ws.rpce("configure", settings())
    }

    const update = (x: Partial<Settings>) => {
        setSettings({
            ...settings()!,
            ...x
        })
    }

    // these need errors in the input group, figure out cell state

    const testOtp = async () => {
        ws.rpcje("testOtp", { code: code() })
    }
    const testEmail = async (s: string) => {
        ws.rpcje("testEmail", { email: s })
    }
    const testText = async (s: string) => {
        ws.rpcje("testSms", { phone: s })
    }
    const testVoice = async () => {
        console.log("testVoice")
        ws.rpcje("testVoice", { phone: settings()!.phone })
    }
    const testPasskey = async () => {

    }
    const testApp = async () => {
    }

    const open = false

    const SwitchVoice = () => {
        // disabled={!!settings()!.phone}
        return <Bb  onClick={testVoice}>Send as voice</Bb>
    }
  

    const active = (b: any) => { return b ? "Active" : "Inactive" }
    return <div class='space-y-6'>
        <P>Activate one or more factors to protect your account. </P>

        <Show when={settings()}>
            <Disclosure defaultOpen={open} as='div'>
                <Db> Passkey: {active(settings()!.activate_passkey)}</Db>
                <Dp><InputButton 
                    onClick={testPasskey}>
                        <Input   
                            placeholder={ln().viewPasskey} 
                            id="username" name="username" type="text" autocomplete="username webauthn" />                   
                </InputButton></Dp>
            </Disclosure>

            <Disclosure defaultOpen={open} as='div'>
                <Db> Time Based Code: {active(settings()!.activate_totp)}</Db>
                <Dp><div class='text-center w-full'><img class='mt-2' src={dataUrl()} /></div>
                    <P>Scan the QR code with a time based password program like Google Authenticator or Authy. Then enter the code it generates below to test</P>
                    <InputButton onClick={testOtp}>
                        <Input 

                        placeholder={ln().enterCode}
                        autofocus onInput={(e) => setCode(e)} />
                    </InputButton></Dp>
            </Disclosure>

            <Disclosure defaultOpen={open} as='div'>
                <Db>Phone number: {active(settings()!.phone)}</Db>
                <Dp>
                   
                    <InputButton 
                    onClick={() => testText(settings()!.phone)}> 
                    <Input
                        value={settings()!.phone}
                        placeholder={ln().phone}
                        autofocus 
                        onInput={(e) => update({ phone: e! })} />
                    </InputButton> 
                    <SwitchVoice/>
                </Dp>
            </Disclosure>

            <Disclosure defaultOpen={open} as='div'>
                <Db>Email: {active(settings()!.email)}</Db>
                <Dp> <InputButton 
                    onClick={() => testText(settings()!.email)}> <Input
                        value={settings()!.email}
                        autocomplete="email"
                        placeholder={ln().email}
                        autofocus
                        onInput={(e) => update({ email: e! })} /></InputButton>
                 </Dp>
            </Disclosure>

            <Disclosure defaultOpen={open} as='div'>
                <Db>IPhone or Android: {active(settings()!.activate_app)}</Db>
                <Dp> 
                   <P >To activate install the iMIS application on your mobile device. Tap the test button, then pick 42 on your phone.</P>
                   <div class='w-16'><LightButton onClick={testApp}>{ln().test}</LightButton></div>
                   </Dp>
            </Disclosure>

            <ButtonSet>
                <Bs1 onClick={save}>{ln().save}</Bs1>
                <Bs onClick={() => props.onClose(true)}>{ln().cancel}</Bs>
              </ButtonSet>
        </Show>
    </div>
}



/*
    const closeSecret = () => {
        setIsOpenGetSecret(false)
        // this onclose should finalize the login
        props.onClose(true)
    }
    const add = async () => {
        const o = await ws.rpcj<any>("addpasskey", {})
        const cco = parseCreationOptionsFromJSON(o)
        if (factor() == Factor.kPasskey || factor() == Factor.kPasskeyp) {
            const o = await ws.rpcj<any>("addpasskey", {})
            const cco = parseCreationOptionsFromJSON(o)
            const cred = await create(cco)
            const token = await ws.rpcj<any>("addpasskey2", cred.toJSON())
            props.onClose(true)
        } else {
            let v = ""
            switch (Number(factor())) {
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


    return <Switch>
        <Match when={isOpenGetSecret()}><GetSecret onClose={closeSecret} validate={validate} /></Match>
        <Match when={true}>
            <Dialog>
                <Center>
                    <DialogPage >
                    <InputLabel >Second Factor</InputLabel>
                        <div class='flex mt-2'>
                            <div class='bg-neutral-900 p-2'>    
                                <div class=' text-black dark:text-white  rounded-md items-center '>
                                {factors.map(([code, name]: [number, string]) => (
                                           <div> <Bb onClick={()=>setFactor(code)}>
                                                {name}&nbsp;&nbsp;&nbsp;
                                                </Bb></div>
                                        ))}
                                    </div>
                            </div>
                        <div class='ml-2'><Switch>
                            <Match when={false}>
                                <div class="space-y-6 ">
                                    <Icon path={key} class="w-24 h-24 mx-auto" />
                                    <p >{ln().addPasskey1}</p>
                                    <p class='text-neutral-500'>{ln().addPasskey2}</p>
                                </div>
                            </Match>
                            <Match when={factor() === Factor.kPasskey || factor() === Factor.kPasskeyp}>
                                    You have a passkey
                            </Match>
                            <Match when={factor() == Factor.kEmail}>
                                <EmailInput onInput={setEmail} />

                            </Match>
                            <Match when={factor() == Factor.kMobile}>
                                <PhoneInput onInput={(e) => setMobile(e)} />

                            </Match>
                            <Match when={factor() == Factor.kVoice}>
                                <PhoneInput onInput={(e: any) => setVoice(e.target.value)} />

                            </Match>
                            <Match when={factor() == Factor.kTotp}>
                                <img src={dataUrl()} />

                            </Match>
                            <Match when={factor() == Factor.kApp}>
                                <div> Install iMis on your phone</div>
                            </Match>
                        </Switch></div></div>
                        <BlueButton onClick={()=>props.onClose(true)}>Done</BlueButton>
                        </DialogPage></Center>
            </Dialog ></Match>
    </Switch>

    */