import { Component, For, Show, createSignal } from "solid-js"
import { Checkbox, FieldSet, Input, TextDivider, ToggleSection } from "./form"
import { LoginWith } from "./login_with"
import { A, H2, InlineButton, P, Page, Title } from "../layout/nav"
import { security, site, welcome } from "./crypto"
// this should be a settings page that is the start page on a new account
// this is at user/~settings
// the ~ is reserved and can't be used in a database name

const [remember, setRemember] = createSignal(false)
const [webauthn, setWebauthn] = createSignal(true)
const [email, setEmail] = createSignal(false)
const [phone, setPhone] = createSignal(false)
const [password, setPassword] = createSignal(false)
const [email2, setEmail2] = createSignal("")
const [phone2, setPhone2] = createSignal("")
const [password2, setPassword2] = createSignal("")
const [pin, setPin] = createSignal(false)
const [pin2, setPin2] = createSignal("")
const [oauth, setOauth] = createSignal(false)
const [totp, setTotp] = createSignal(false)
const [device, setDevice] = createSignal("")

export const Settings: Component = () => {
    return <Page>
        <Title>Settings</Title><div class='  px-4 py-3' role='alert'>

            <div class='space-y-6'>
                <H2>Settings</H2>
                <Show when={welcome()}><p>Welcome to {site().name}.</p></Show>
                <ListUsers />
                <ListDevices />
                

            </div>
        </div></Page>
}

// if we are displaying this page, the user should already exist

// show a list of devices and allow them to be revoked.
export const ListUsers: Component = () => {
    const [edit,setEdit] = createSignal(false)
    const erase = () => {
    }
    return <FieldSet>
        <TextDivider>User Identity</TextDivider>
        <table><tbody>
            <For each={[]}>{(us, i) => {
                return <tr><td><InlineButton>edit</InlineButton></td><td>{"name"}</td>
                    <td class='text-green-300'>{""}</td></tr>
            }}</For>
        </tbody></table>
        <InlineButton>Add Identity</InlineButton>
        <FieldSet>
        <Show when={edit()}>
            <p>All fields are optional</p>
            <Input value={email2()} name="email" placeholder="Email" />
            <Input value={phone2()} name="phone" placeholder="Phone" />
        </Show>
    </FieldSet>

        <div>We recommmend you<A target='_blank' href='https://www.schneier.com/blog/archives/2005/06/write_down_your.html'> write down your secret phrase</A> on paper with pencil. Then <InlineButton onClick={erase}>erase</InlineButton> them here.</div>

    </FieldSet>
}
export const ListDevices: Component = () => {
    const erase = () => {
    }
    return <FieldSet>
        <TextDivider>Devices</TextDivider>
        <p>Your account is only available from this device and this browser profile.</p>
        <ToggleSection header='Add device'>
            <LinkDevice />
        </ToggleSection>
    </FieldSet>
}
export const LinkDevice: Component = () => {
    return <img src='qr.png' class='w-96' />
}

/*
export const Secure: Component = () => {



    return <FieldSet>
        <TextDivider>Sign in options</TextDivider>

        Your identity is not protected by a password.



        <Checkbox value={webauthn} setValue={setWebauthn} title='No password  (Webauthn)' >Webauthn generally uses tokens or biometrics to log in</Checkbox>

        <Checkbox value={remember} setValue={setRemember} title='Trusted Computer' >Remember for 30 days</Checkbox>
        <Checkbox value={password} setValue={setPassword} title='Password' >Allow Password</Checkbox>
        <Show when={password()}>
            <Input type='password' value={password2()} name="phone" placeholder="Password" />
            <Input type='password' value={password2()} name="phone" placeholder="Confirm" />
        </Show>
        <Checkbox value={totp} setValue={setTotp} title='Time changing code' >Use Authy, Google Authenticator, or Microsoft Authenticator (Time based code) </Checkbox>
        <Show when={totp()}>
            <img src='/qr.png'></img>
        </Show>
        <Checkbox value={oauth} setValue={setOauth} title='Sign in with Apple, Google, etc' >Sign in with Apple, Google, Twitter, or Github</Checkbox>
        <Show when={oauth()}>
            <LoginWith></LoginWith></Show>
        <TextDivider>RecoveryOptions</TextDivider>

        <div class='mt-1'> <A href=''>Tell me more</A> </div>


        <Checkbox value={email} setValue={setEmail} title='Email recovery' >Allow email recovery</Checkbox>
        <Show when={email()}>
            <Input value={email2()} name="email" placeholder="Email" />
        </Show>
        <Checkbox value={phone} setValue={setPhone} title='Phone recovery' >Allow phone/text based recovery</Checkbox>
        <Show when={phone()}>
            <Input value={phone2()} name="phone" placeholder="Phone" />
        </Show>

        <Checkbox value={pin} setValue={setPin} title='PIN recovery' >Require PIN for recovery</Checkbox>
        <Show when={pin()}>
            <Input type='password' value={pin2()} name="pin" label="PIN" />
            <Input type='password' value={pin2()} name="pin" label="Confirm" />
        </Show>

    </FieldSet>
}
*/