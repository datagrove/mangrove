import { Component } from "solid-js"
import { BlueButton, Center } from "../lib/form"
import { EmailInput, PhoneInput } from "./passkey_add"

export const SettingsPage: Component<{}> = (props) => {
    return <div>
        <Center>
            <div class=''>Settings</div>
            <EmailInput></EmailInput>
            <PhoneInput></PhoneInput>
            <BlueButton>Update</BlueButton>
        </Center>
    </div>
}