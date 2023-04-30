import { Icon } from "solid-heroicons";
import { key } from "solid-heroicons/solid";
import { Component, createEffect, createSignal, JSXElement, Match, onMount, Show, Switch } from "solid-js";
import { Center, BlueButton, LightButton } from "../lib/form";
import { useLn } from "./passkey_i18n";
import { A } from "../layout/nav";

export interface UserMfa {

}

export const Input = (props: any) => {
    return <input {...props} class="block w-full rounded-md border-0 dark:bg-neutral-900 bg-neutral-100 py-1.5  shadow-sm ring-1 ring-inset dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
}
export const EmailInput = (props: any) => {
    return <Input placeholder='email'/>
}
export const PhoneInput = (props: any) => {
    return <Input placeholder='phone'/>
}
export const TotpInput = (props: any) => {
    return <img src='/qrcode.png'/>
}
export const Dialog: Component<{ children: JSXElement}> = (props) => {
    return <div
    class="fixed  inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
    id="my-modal"
    //onClick={() => props.onChange({})}
    role="presentation"
>
    <Center>
        {props.children}
    </Center>
</div>
}
export const DialogPage: Component<{ children: JSXElement}> = (props) => {
    return                         <div class="mx-auto p-5 h-128 border w-96 shadow-lg rounded-md dark:bg-black bg-white">{props.children}</div>
}

export const AddPasskey: Component<{ when: () => boolean, required?: boolean, onChange: (u: UserMfa) => void }> = (props) => {
    const ln = useLn()
    let btnSaveEl: HTMLButtonElement | null = null;
    let btnNot: HTMLButtonElement | null = null;
    const [screen,setScreen] = createSignal(2)
    const [factor, setFactor] = createSignal(localStorage.getItem("factor") || "passkey")

    createEffect(() => {
        if (props.when()) {

            btnSaveEl?.focus()

        }
    })

    const add = () => {
        props.onChange({})
    }
    const notNow = () => { props.onChange({}) }
    const notEver = () => { props.onChange({}) }

    const more = (e: any) => {
        e.preventDefault();
        setScreen(2)
        console.log("more")
    }
    const submit = (e: any) => {
        e.preventDefault();
        props.onChange({})

    }
    return <><Show when={props.when()}>
        <Dialog>
            <Center>
            <DialogPage>
                <Show when={screen()!=1}>
                <div class=' text-black dark:text-white p-2 mr-2 rounded-md items-center space-x-2'>
                <select
                    id='ln'
                    value={factor()}
                    aria-label="Select language"
                    class='flex-1  rounded-md dark:bg-neutral-900 text-black dark:text-white '
                    oninput={(e) => props.onChange(e.target.value)}>
                    {factors.map(([code, name]) => (
                        <option value={code}>
                            {name}&nbsp;&nbsp;&nbsp;
                        </option>
                    ))}
                </select>
            </div>
                </Show>
                <Switch>
                    <Match when={factor() == "passkey"}>
                        
                        <BlueButton > Add Passkey</BlueButton>
                   
                    </Match>
                    <Match when={factor() == "email"}>
                        <EmailInput/>
                        <BlueButton>Send</BlueButton>
                    </Match>
                    <Match when={factor() == "sms"}>
                        <PhoneInput/>
                        <BlueButton>Send</BlueButton>
                    </Match>        
                    <Match when = {factor() == "totp"}>
                        <TotpInput/>
                        <BlueButton>Send</BlueButton>
                            </Match>
                        <Match when={factor()=="app"}>

                        </Match>
                    <Match when={screen() == 1}>
                        
                            <div class="space-y-6 ">

                                <Icon path={key} class="w-24 h-24 mx-auto" />
                                <p >{ln().addPasskey1}</p>
                                <p class='text-neutral-500'>{ln().addPasskey2}</p>
                                <form onSubmit={submit} class="space-y-6">
                                    <div class='flex space-x-4'> <div class='flex-1 ' />
                                        <div class='w-24'><LightButton tabindex='2' ref={btnNot!} onClick={notNow}>{ln().notNow}</LightButton></div>
                                        <div class='w-24'><LightButton tabindex='3' onClick={notEver}>{ln().notEver}</LightButton></div>
                                        <div class='w-24'><BlueButton tabindex='1' ref={btnSaveEl!} onClick={add}>{ln().add}</BlueButton></div>
                                    </div>
                                    <div class=' flex'><div class='flex-1' /><A href='#' onClick={more}>{ln().more2fa}</A></div>
                                </form>

                            </div>
                    </Match>
                </Switch>
                </DialogPage></Center>
       </Dialog></Show>
    </>

};

type KeyValue = [string, string]
const factors: KeyValue[] = [
    ["passskey", "Passkey"],
    ["passskey+", "Passkey and Password"],
    ["totp", "Time Based Code"],
    ["sms", "Text Message"],
    ["email", "Email"],
    ["app", "Phone App"],
    ["voice", "Voice Call"],
]

