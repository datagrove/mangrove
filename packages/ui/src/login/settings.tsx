import { Component, JSX, Match, Setter, Show, Signal, Switch, createEffect, createSignal, onMount } from "solid-js"
import { CheckboxSet, InputButton, KeyValue, KeyValueMap, LightButton, P, RadioGroup, Select } from "../lib/form"
import { Input, LoginInfo } from "./passkey_add"
import { Bb, H2, SimplePage } from "../layout/nav"

import { createWs } from "../core/socket";
import { useLn } from "./passkey_i18n";
import { Disclosure } from "solid-headless";
import { Login } from "./login";
import { useNavigate } from "../core/dg";
import { Db, Dp, ButtonSet, Bs1, Bs } from "./settings2";
import { SetStoreFunction, createStore, produce, unwrap } from "solid-js/store";

const allOptions = {
    social: [
        "Apple",
        "Google",
        "Facebook",
        "Twitter",
        "Github",
        "Microsoft"
    ],
    other: [
        "Passkey",
        "Passkey and Password",
        "TOTP",
        "TOTP and Password",
        "Email",
        "Phone",
        "App",
        "SSH"]
}
function makeKvm(list: string[]): KeyValueMap {
    const o: KeyValueMap = {}
    list.forEach((k) => o[k] = k)
    return o
}
export interface RoleSet {
    [key: string]: KeyValueMap
}

// this is what we can load and save per user
export interface Settings {
    role: string  // current user
    password: string
    img: Uint8Array | undefined
    email: string
    phone: string
    passkey: number
    totp: number
    app: number
    social: KeyValueMap
}

const defaultSettings: Settings = {
    role: "Admin",
    password: "",
    img: undefined,
    email: "jimh@datagrove.com",
    phone: "",
    passkey: 0,
    totp: 0,
    app: 0,
    social: {}
}
const defaultOptions: RoleSet = {
    "Admin": {
        "Admin": true,
        ...makeKvm(allOptions.social),
        ...makeKvm(allOptions.other)
    },
    "Base": {
        ...makeKvm(allOptions.social),
        ...makeKvm(allOptions.other)
    }
}

// not stored, this represents possible options


type Store<T> = [T, SetStoreFunction<T>]

// how do we skip this page if we are already logged in? do we want to?
export const SettingsPage: Component<{}> = (props) => {
    const ws = createWs()
    const ln = useLn()
    const nav = useNavigate()

    const [settings, setSettings] = createStore<Settings>(defaultSettings)
    const [opt, setOpt] = createStore<RoleSet>(defaultOptions)
    const [login, setLogin] = createSignal(true)

    // we should use a resource like thing to get the current settings using the secret that's in the login info.
    const finishLogin = async (l: LoginInfo) => {
        const [o, e]: [Settings | undefined, string] = await ws.rpce<Settings>("settings", {})
        console.log("settings", o)
        if (e) {
            return
        }
        setSettings(o!)
        setLogin(true)
    }

    const done = async (save: boolean) => {
        console.log("done", unwrap(settings), unwrap(opt))
        if (save) {
            ws.rpce("configure", settings)
        }
        setLogin(false)
    }

    return <SimplePage>
        <Switch>
            <Match when={login()}>
                <FactorSettings
                    opt={[opt, setOpt]}
                    settings={[settings, setSettings]}
                />
                <div class='mt-2' ><ButtonSet>
                    <Bs1 onClick={() => done(true)}>{ln().save}</Bs1>
                    <Bs onClick={() => done(false)}>{ln().cancel}</Bs>
                </ButtonSet></div>
            </Match>
            <Match when={true}>
                <H2 class='mb-2'>Change Security Settings</H2>
                <P class='mb-4'>First Login in with your existing settings</P>
                <Login finishLogin={finishLogin} />
            </Match>
        </Switch>
    </SimplePage>
}
const kvl = (k: string[]): KeyValue[] => k.map(x => [x, x])
export const FactorSettings: Component<{ settings: Store<Settings>, opt: Store<RoleSet> }> = (props) => {
    const ws = createWs()
    const ln = useLn()
    const nav = useNavigate()
    const [settings, setSettings] = props.settings
    const [opt, setOpt] = props.opt

    const myopt = () => opt[settings.role]

    console.log("settings", settings)
    console.log("opt", opt)
    console.log("myopt", myopt())


    const [role, setRole] = createSignal(settings.role)

    // user options
    const [sopt, setSopt] = createSignal<KeyValueMap>(settings.social)
    // site options
    const [ropt, setRopt] = createSignal<KeyValueMap>(myopt())



    const [dataUrl, setDataUrl] = createSignal<string>("")
    const [code, setCode] = createSignal("")
    // these need errors in the input group, figure out cell state
    const [error, setError] = createSignal<{ [key: string]: JSX.Element }>({})
    const roles = kvl(["Base", "Admin"])
    const options = kvl([
        ...allOptions.other,
        ...allOptions.social
    ])
    const redText = (s: string) => {
        return <div class="text-sm text-red-600 ">{s}</div>
    }
    onMount(async () => {
        const bl = new Blob([settings.img!], { type: 'image/png' });
        const reader = new FileReader();
        reader.readAsDataURL(bl);
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setDataUrl(dataUrl)
        }
    })

    const ok = "Success!"
    const testOtp = async () => {
        const [_, e] = await ws.rpcje("testOtp", { code: code() })
        setError({
            ...error(),
            totp: e ?? ok
        })
    }
    const testEmail = async (s: string) => {
        const [_, e] = await ws.rpcje("testEmail", { email: s })
        setError({
            ...error(),
            email: e ?? ok
        })
    }
    const testText = async (s: string) => {
        const [_, e] = await ws.rpcje("testSms", { phone: s })
        setError({
            ...error(),
            phone: e ?? ok
        })
    }
    const testVoice = async () => {
        const [_, e] = await ws.rpcje("testVoice", { phone: settings.phone })
        setError({
            ...error(),
            phone: e ?? ok
        })
    }
    const testPasskey = async () => {

    }
    const testApp = async () => {
        const [_, e] = await ws.rpcje("testVoice", { phone: settings.phone })
        setError({
            ...error(),
            app: e ?? ""
        })
    }

    const open = false

    const PasskeySet: Component<{}> = (props) => {
        const opts: KeyValue[] = [
            ["0", "Passkey only"],
            ["1", "Passkey with password"],
            ["2", "Never"]
        ]

        const [v, setV] = createSignal(settings.passkey + "")
        createEffect(() => {
            setSettings({
                ...settings,
                passkey: parseInt(v())
            })
        })
        return <RadioGroup opts={opts} value={[v, setV]} />
    }
    const TotpSet: Component<{}> = (props) => {
        const opts: KeyValue[] = [
            ["0", "Totp only"],
            ["1", "Totp with password"],
            ["2", "Never"]
        ]
        const [v, setV] = createSignal(settings.totp + "")
        createEffect(() => {
            setSettings({
                ...settings,
                passkey: parseInt(v())
            })
        })
        return <RadioGroup opts={opts} value={[v, setV]} />
    }

    const active = (b: any) => { return b ? "Active" : "Inactive" }

    return <div class='space-y-6'>
        <P>Activate one or more factors to protect your account. </P>

        <Show when={ropt()["Passkey"]}> <Disclosure defaultOpen={open} as='div'>
            <Db> Passkey: {active(settings.passkey != 2)}</Db>
            <Dp>
                <PasskeySet />
                <InputButton
                    onClick={testPasskey}>
                    <Input
                        error={() => error().passkey}
                        placeholder={ln().viewPasskey}
                        id="username" name="username" type="text" autocomplete="username webauthn" />
                </InputButton>
            </Dp>

        </Disclosure></Show>

        <Disclosure defaultOpen={open} as='div'>
            <Db> Time Based Code: {active(settings.totp != 2)}</Db>
            <Dp>
                <div class=''><img class='mt-2' src={dataUrl()} /></div>
                <TotpSet />

                <P>Scan the QR code with a time based password program like Google Authenticator or Authy. Then enter the code it generates below to test</P>
                <InputButton onClick={testOtp}>
                    <Input
                        error={() => error().totp}
                        placeholder={ln().enterCode}
                        autofocus onInput={(e) => setCode(e)} />
                </InputButton>

            </Dp>
        </Disclosure>

        <Disclosure defaultOpen={open} as='div'>
            <Db>Phone number: {active(settings.phone)}</Db>
            <Dp>

                <InputButton
                    onClick={() => testText(settings.phone)}>
                    <Input
                        value={settings.phone}
                        placeholder={ln().phone}
                        autofocus
                        onInput={(e) => {
                            setSettings(produce((s) => {
                                s.phone = e
                            }))
                        }} />
                </InputButton>
                <Bb onClick={testVoice}>Send as voice</Bb>
            </Dp>
        </Disclosure>

        <Disclosure defaultOpen={open} as='div'>
            <Db>Email: {active(settings.email)}</Db>
            <Dp> <InputButton
                onClick={() => testText(settings.email)}> <Input
                    value={settings.email}
                    autocomplete="email"
                    placeholder={ln().email}
                    autofocus
                    onInput={(e) => setSettings({ ...settings, email: e! })} /></InputButton>
            </Dp>
        </Disclosure>

        <Disclosure defaultOpen={open} as='div'>
            <Db>IPhone or Android: {active(settings.app)}</Db>
            <Dp>
                <P >To activate install the iMIS application on your mobile device. Tap the test button, then pick 42 on your phone.</P>
                <div class='w-16'><LightButton onClick={testApp}>{ln().test}</LightButton></div>
            </Dp>
        </Disclosure>

        <Disclosure defaultOpen={open} as='div'>
            <Db>SSH keys</Db>
            <Dp><textarea placeholder={"Paste public SSH keys here"} class='w-full' rows='6'></textarea>

                <div class='flex items-center'>

                    <textarea class='flex-1 mr-2' placeholder={"Test your keys by signing the word 'test' and pasting the result here"} rows='3'></textarea>
                    <div class='w-16'><LightButton class='h-6' onClick={testApp}>{ln().test}</LightButton></div>
                </div>

            </Dp>
        </Disclosure>
        <Disclosure defaultOpen={open} as='div'>
            <Db>Sign in with Apple, etc</Db>
            <Dp>
                <div><CheckboxSet opts={kvl(allOptions.social)} value={[sopt, setSopt]} /> </div>
            </Dp>
        </Disclosure>
        <Show when={ropt()["Admin"]}>
            <Disclosure defaultOpen={open} as='div'>
                <Db>Admin: Login Options</Db>
                <Dp>
                    <div>
                        <div class='mb-2'>
                            <Select opts={roles} value={[role, setRole]} /></div>
                        <CheckboxSet opts={options} value={[ropt, setRopt]} />
                    </div>
                </Dp>
            </Disclosure>
        </Show>


    </div>
}

// instead these should map values through ln()
// const roles: KeyValue[] = ["Base", "Admin"].map(x => [x, x])
// const oauth: KeyValue[] = social.map((x) => [x, x])
// const options: KeyValue[] = [
//     ...base,
//     ...oauth
// ]
/*
type BoolMap = { [key: string]: boolean }
export const OauthOptions = (props: {}) => {
    const oauth = kvl(allOptions.social)
    const vs = createSignal<BoolMap>({})
    return <div>
        <CheckboxSet opts={oauth} value={vs} />
    </div>
}
export const AdminOptions = (props: {}) => {
    const r = createSignal<string>("Base")
    const vs = createSignal<BoolMap>({})
    const roles = kvl(["Base", "Admin"])
    const options = kvl([
        ...allOptions.other,
        ...allOptions.social
    ])
    return <div>
        <div class='mb-2'><Select opts={roles} value={r}></Select></div>
        <CheckboxSet opts={options} value={vs} />
    </div>

}




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