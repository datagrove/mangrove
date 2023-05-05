import src from "base-x"
import { phone } from "solid-heroicons/solid"
import { Component, Switch, Match, createSignal } from "solid-js"
import { EmailInput } from "./passkey_add"
import { Factor } from "./passkey_i18n"
import { Segment } from "../lib/progress"

type PickerProps<T> = { value: () => T, onInput: (_: Partial<T>) => void }

// this list may be subsetted: no app etc.

type keym = {
    passkey: true,
    email: true,
    phone: true,
    time: true,
    app: true,
}
const keys: (keyof keym)[] = ["passkey", "email", "phone", "time", "app"]


export type FactorData = {
    factor: keyof keym,
    email?: string,
    mobile?: string,
    voice?: string,
    totp?: string,
    app?: string,
}

type Props = { factors: (keyof keym)[] } & PickerProps<FactorData>

// forms like this should cause async storage somewhere, how?
// onchange can be async? diffing? take partials?
export const PickFactor: Component<{
    reset: () => FactorData,
    onInput: (f: FactorData) => void
}> = (props) => {
    const factor = () => props.reset().factor

    const [state, setState] = createSignal(props.reset())

    const update = (st: Partial<FactorData>) => {
        setState({ ...state(), ...st })
    }

    return <div>
        <Segment options={keys} value={factor} onChange={props.onInput} />
        <Switch>

            <Match when={factor() === 'passkey'}>

            </Match>
            <Match when={factor() == 'email'}>
                <EmailInput onInput={update('email')} reset={reset('email')} />

            </Match>
            <Match when={factor() == 'phone'}>
                <PhoneInput onInput={setMobile} />

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
        </Switch>
    </div>
}