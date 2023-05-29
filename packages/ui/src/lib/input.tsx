import { Component, createSignal, JSX, onMount, Show } from "solid-js"
import { Cell } from "../db/v2/cell"
import { InputLabel } from "../login/passkey_add"
import { useLn, _ } from "../login/passkey_i18n"

export type InputProps = {
    reset?: () => string,   // should not be same signal as onInput
    class?: string,
    id?: string,
    name?: string,
    type?: string,
    value?: string,
    autocomplete?: string,
    placeholder?: string,
    autofocus?: boolean,
    onInput?: (value: string) => void,
}

export const Input = (props: InputProps & { error?: () => JSX.Element }) => {
    let inp!: HTMLInputElement
    onMount(() => {
        if (props.autofocus) {
            setTimeout(() => inp.focus())
        }
    })

    return <><div><input
        {...props} ref={inp}
        value={props.reset ? props.reset() : props.value}
        onInput={props.onInput ? (e) => props.onInput!(e.target.value) : undefined}
        class="block w-full rounded-md border-0 dark:bg-neutral-900 bg-neutral-100 py-1.5  shadow-sm sm:text-sm sm:leading-6 p-2" /></div>
        <Show when={props.error && props.error()}>
            <div class='mt-2'>{props.error!()}</div>
        </Show>
    </>
}



export const InputCell: Component<{ cell: Cell, autofocus?: boolean }> = (props) => {
    const ln = useLn()
    const n = props.cell.opt.name!
    const [error,setError] = createSignal<SyntaxError[]>()
    const setCell = (e: string) => {
        props.cell.clearErrors()
        props.cell.setValue(e)
    }
    return <div >
        <div class="flex items-center justify-between">
            <InputLabel for={n} >{_(n)}</InputLabel>
            <Show when={props.cell.opt.topAction}>
                <div />
                <div>{props.cell.opt.topAction!()}</div>
            </Show>
        </div>
        <div >
            <Input {...props} value={props.cell.value()} autofocus={props.autofocus || props.cell.opt.autofocus} onInput={setCell} placeholder={_(n)} id={n} name={n} type={props.cell.opt.type ?? "text"} autocomplete={props.cell.opt.autocomplete} />
        </div>
        <div>
            <Show when={error()}>
                <div class="text-sm text-red-600 mt-2">{error()![0].message}</div>
            </Show>
        </div>

    </div>
}

export const EmailInput: Component<InputProps> = (props) => {
    const ln = useLn()
    return <div>
        <div class="flex items-center justify-between">
            <InputLabel for="username" >{ln().email}</InputLabel>
        </div>
        <div class="mt-2"><Input {...props} placeholder={ln().email} autocomplete='email' /></div>
    </div>
}
export const PhoneInput = (props: InputProps) => {
    const ln = useLn()
    return <div>
        <div class="flex items-center justify-between">
            <InputLabel for="username" >{ln().phone}</InputLabel>
        </div>
        <div class="mt-2"><Input {...props} placeholder={ln().phone} autocomplete='phone' /></div>
    </div>
}

/*
export const Input: Component<{
    id: string,
    name: string,
    autofocus?: boolean,
    onInput?: (x: string) => void,
    onChange?: (x: string) => void,
    value: string,
    setValue?: (x: string) => void,
    label?: string,
    placeholder?: string
    type?: string
}> = (props) => {

    return <div>
        <Show when={props.label}><label for={props.name} class="block text-sm font-medium leading-6 text-neutral-900 dark:text-white">{props.label}</label></Show>
        <input type={props.type ?? "text"} value={props.value} autofocus={props.autofocus} onInput={(e) => {
            if (props.onInput) props.onInput((e.target as HTMLInputElement).value)
        }} id={props.name}
            onchange={(e) => {
                if (props.onInput)
                    props.onInput((e.target as HTMLInputElement).value)
            }} placeholder={props.placeholder} class="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 disabled:opacity-50 focus:border-indigo-500" /></div>
}

*/
