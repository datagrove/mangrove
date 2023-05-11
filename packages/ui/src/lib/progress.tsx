
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






const Underline: Component<{ checked: boolean }> = (props) => {
    return <span aria-hidden="true" classList={{
        hidden: !props.checked,
    }} class="bg-indigo-500 absolute inset-x-0 bottom-0 h-0.5"></span>

}
