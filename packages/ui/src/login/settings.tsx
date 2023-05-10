import { Component, JSX, Match, Show, Switch, createSignal } from "solid-js"
import { BlueButton, Center } from "../lib/form"
import { AddPasskey, Dialog, DialogPage, EmailInput, GetSecret, Input, InputLabel, LoginInfo, PhoneInput, Username } from "./passkey_add"
import { Bb, SimplePage } from "../layout/nav"
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
import { loginInfo } from "./login";
import { useNavigate } from "../core/dg";

/*
export function sheet(data: { [key: string]: any }) : {[key: string]: Cell} {
    return {}
}
export 
export const DebugPage = () => {

    const data = {
        phone2fa: true,
        email2fa: true,
        totp2fa: true,
        passkey: true,
    }
    const dc = sheet(data)

    return <SimplePage>
        <div>This page is for demonstration purposes and would not exist in a deployed product</div>
        <OptionList />
            <OptionCell cell=
       </SimplePage>

}*/


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
    return <DisclosurePanel class="px-4 space-y-6 pt-4 pb-2 text-sm text-gray-500">
        {props.children}
    </DisclosurePanel>
}




// we should have loginInfo here, since we must be logged in for this to make sense.
// but we could have moved away from the page, so we need to use the login cookie or similar to restore the login info. We can keep everything in sessionStorage? It depends on how we want to manage logins, if we want to log back in without challenge then we need to keep in localStorage.

// must use cbor to get uint8array

export const SettingsPage: Component<{}> = (props) => {
    return <SimplePage>
        <FactorSettings onClose={() => { }} />
    </SimplePage>
}



export interface Settings {
    user_secret: string
    img: Uint8Array | undefined
    email: string
    phone: string
    activatePasskey: boolean
    activateTotp: boolean
}


export const FactorSettings: Component<{ onClose: (x: boolean) => void }> = (props) => {

    const ws = createWs()
    addMock("settings", async (x) => {
        const r: Settings = {
            user_secret: "secret",
            img: undefined,
            email: "jimh@datagrove.com",
            phone: "+14843664923",
            activatePasskey: true,
            activateTotp: true,
        }
        return r
    })
    addMock("configure", async (x) => {
        console.log(x)
    })



    const ln = useLn()
    const nav = useNavigate()
    const [settings, setSettings] = createSignal<Settings | undefined>()
    const [dataUrl, setDataUrl] = createSignal<string>("")
    const [challenge, setChallenge] = createSignal("")

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
    const testOtp = async (s: string) => {
        ws.rpce("testOtp", { email: s })
    }
    const testEmail = async (s: string) => {
        ws.rpce("testEmail", { email: s })
    }
    const testText = async (s: string) => {
        ws.rpce("testSms", { phone: s })
    }
    const testPasskey = async () => {

    }

    const active = (b: any) => { return b ? "Active" : "Inactive" }
    return <div class='space-y-6'>
        <p>Activate one or more factors to protect your account. </p>
        <Show when={settings()}>
            <Disclosure defaultOpen={false} as='div'>
                <Db> Passkey: {active(settings()!.activatePasskey)}</Db>
                <Dp>
                    Tap the user name field to manage your passkeys. Pick one to test it.
                    <Input {...props} placeholder={ln().enterUsername} id="username" name="username" type="text" autocomplete="username webauthn" />
                    <div class='w-24'><BlueButton onClick={testPasskey}>Test</BlueButton></div>
                </Dp>
            </Disclosure>
            <Disclosure defaultOpen={false} as='div'>
                <Db> Time Based Code: {active(settings()!.activateTotp)}</Db>
                <Dp><img src={dataUrl()} />
                    <Input autofocus onInput={(e) => setChallenge(e)} />
                    <div class='w-24'><BlueButton onClick={() => testOtp(challenge())}>Test</BlueButton></div></Dp>
            </Disclosure>
            <Disclosure defaultOpen={false} as='div'>
                <Db>Phone number: {active(settings()!.phone)}</Db>
                <Dp>  <Input autofocus onInput={(e) => update({ phone: e })} />
                    <div class='w-24'><BlueButton onClick={() => testText(settings()!.phone)}>Test</BlueButton></div>
                </Dp>
            </Disclosure>
            <Disclosure defaultOpen={false} as='div'>
                <Db>Email: {active(settings()!.email)}</Db>
                <Dp>  <Input autofocus onInput={(e) => update({ email: e })} />
                    <div class='w-24'><BlueButton onClick={() => testEmail(settings()!.email)}>Test</BlueButton></div></Dp>
            </Disclosure>
            <BlueButton onClick={save}>Save</BlueButton>
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