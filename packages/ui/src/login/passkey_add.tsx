import { Icon } from "solid-heroicons";
import { key } from "solid-heroicons/solid";
import { Component, createEffect, createSignal, Match, onMount, Show, Switch } from "solid-js";
import { Center, BlueButton, LightButton } from "../lib/form";
import { useLn } from "./passkey_i18n";
import { A } from "../layout/nav";

export interface UserMfa {

}

export const AddPasskey: Component<{ when: () => boolean, required?: boolean, onChange: (u: UserMfa) => void }> = (props) => {
    const ln = useLn()
    let btnSaveEl: HTMLButtonElement | null = null;
    let btnNot: HTMLButtonElement | null = null;
    const [screen] = createSignal(1)
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
    }
    const submit = (e: any) => {
        e.preventDefault();
        props.onChange({})
    }
    return <><Show when={props.when()}>
        <div
            class="fixed  inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
            id="my-modal"
            //onClick={() => props.onChange({})}
            role="presentation"
        >
            <Center>
                <Switch>
                    <Match when={screen() == 1}>
                        <div class="mx-auto p-5 border w-96 shadow-lg rounded-md dark:bg-black bg-white">
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
                                    <div class=' hidden flex'><div class='flex-1' /><A href='#' onClick={more}><PickFactor value={factor} onChange={setFactor} /></A></div>
                                </form>

                            </div></div>
                    </Match>
                </Switch>
            </Center>
        </div></Show>
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

const PickFactor: Component<{ value: () => string, onChange: (e: string) => void }> = (props) => {
    return <div class='flex text-black dark:text-white p-2 mr-2 rounded-md items-center space-x-2'>
        <select
            id='ln'
            value={props.value()}
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
}
