
// second factors
// passkey email phone time app

import { Component, For } from "solid-js"
import { lx, useLn } from "../login/passkey_i18n"

// we could combine email and phone? phone and voice

export const Select: Component<{}> = () => {
    return <div class="sm:hidden">
        <label for="tabs" class="sr-only">Select a tab</label>
        <select id="tabs" name="tabs" class="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
            <option selected>My Account</option>
            <option>Company</option>
            <option>Team Members</option>
            <option>Billing</option>
        </select>
    </div>
}




//       <!-- Current: "text-gray-900", Default: "text-gray-500 hover:text-gray-700" -->
export const Segment: Component<{ option: string[], value: () => string, onChange: (_: string) => void }> = (props) => {
    const ln = useLn()

    const selected = (x: boolean) => "block text-center flex-1 rounded-md px-3 py-2 text-sm font-medium " + (x ? "bg-gray-100 text-gray-700" : "text-gray-500 hover:text-gray-700")
    return <div>
        <div class="hidden sm:block">
            <nav class="isolate flex rounded-lg shadow" aria-label="Tabs">
                <For each={props.option}>{(e, i) => {

                    let cl = () => selected(e === props.value())
                    return <a href="#" onClick={() => props.onChange(e)} class={cl()} aria-current="page">{lx(e)}</a>
                }}</For>
            </nav>
        </div>
    </div>
}



const Underline: Component<{ checked: boolean }> = (props) => {
    return <span aria-hidden="true" classList={{
        hidden: !props.checked,
    }} class="bg-indigo-500 absolute inset-x-0 bottom-0 h-0.5"></span>

}
