import { Component, createSignal } from "solid-js"
import { useLn } from "../../i18n-solid/src"
import { Bb, Input, InputCell, InputLabel, InputProps } from "../../ui-solid/src"
import { Cell } from "../../datagrove/src"



export const Password: Component<InputProps & { required?: boolean }> = (props) => {
    const ln = useLn()
    const [hide, setHide] = createSignal(true)
    let el: HTMLInputElement

    const toggle = (e: any) => {
        e.preventDefault()
        setHide(!hide())
        if (!hide()) {
            el.type = 'text';
        } else {
            el.type = 'password';
        }
    }

    return <div>
        <div class="flex items-center justify-between">
            <InputLabel for="password" >{ln().password}</InputLabel>
            <div class="text-sm">
                <button tabindex='-1' onClick={toggle} class="font-semibold hover:underline  hover:text-indigo-700 dark:text-blue-400 text-blue-700">{hide() ? ln().show : ln().hide} {ln().password}</button>
            </div>
        </div>
        <div >
            <Input {...props} ref={el!} id="password" name="password" type={hide() ? "password" : "text"} autocomplete="current-password" placeholder={ln().enterPassword} />
        </div>

    </div>
}

export const PasswordCell: Component<{ cell: Cell }> = (props) => {
    const ln = useLn()
    const [hide, setHide] = createSignal(true)
    const top = () => <Bb onClick={() => setHide(!hide())} >{hide() ? ln().show : ln().hide}</Bb>
    const c = () => {
        return {
            ...props.cell,
            type: hide() ? "password" : "text",
            topAction: top
        }
    }
    return <InputCell cell={props.cell} />
}