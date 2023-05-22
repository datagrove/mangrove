import { ButtonProps } from "solid-headless"
import { Accessor, Component, For, JSX, JSXElement, ParentComponent, Show, Signal, createEffect, createSignal } from "solid-js"
import { Bb } from "../layout/nav"
import { SetStoreFunction, Store, produce } from "solid-js/store"
import { BlobOptions } from "buffer"
import { lx, useLn } from "../login/passkey_i18n"

export const FieldSet: Component<{ children: JSXElement }> = (props) => {
    return <fieldset class="relative flex items-start ">
        <div class='space-y-5'>{props.children}</div></fieldset>
}

export const CheckboxSubtitle = (props: { children: JSXElement }) => {
    return <p class="text-gray-500">{props.children}</p>
}
export const Checkbox: Component<{
    children: JSXElement,
    //title: string,
    checked: () => boolean, onChange: (checked: boolean) => void
}> = (props) => {
    return <div class="relative flex items-start">
        <div class="flex h-6 items-center">
            <input checked={props.checked()} id="comments" aria-describedby="comments-description" onInput={() => props.onChange(!props.checked())} name="comments" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-200 dark:text-neutral-800 dark:focus:ring-neutral-500 focus:ring-indigo-600" />
        </div>
        <div class="ml-3 text-sm leading-6">
            <label for="comments" class="font-medium dark:text-white text-gray-900">{props.children}</label>

        </div>
    </div>

}

export const ToggleSection: Component<{
    children: JSXElement,
    header: string,
    class?: string
}> = (props) => {
    const [show, setShow] = createSignal(false)
    return <div class={props.class}>
        <div class='flex'> <button class='text-indigo-600 hover:text-blue-500 hover:underline' onClick={() => setShow(!show())} >{props.header}</button></div>
        <Show when={show()}>{props.children}</Show>
    </div>

}


export const Center: Component<JSX.AnchorHTMLAttributes<HTMLDivElement>> = (props) => {
    return <div class="grid place-items-center h-screen">
        <div {...props} class='w-96'>
            {props.children}
        </div></div>
}

export const BlueButton: Component<ButtonProps> = (props) => {
    let b: HTMLButtonElement
    createEffect(() => {
        if (b.autofocus) b.focus()
    })
    return <button {...props} ref={b!} disabled={props.disabled} onClick={props.onClick} class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 disabled:opacity-50">{props.children}</button>
}
export const LightButton: Component<ButtonProps> = (props) => {
    return <button {...props} disabled={props.disabled} onClick={props.onClick} class="flex w-full justify-center rounded-md bg-neutral-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">{props.children}</button>
}


export const TextDivider: Component<{ class?: string, children: string }> = (props) => {
    return <div class={`${props.class} relative mt-4 w-full`}>
        <div class="absolute inset-0 flex items-center w-full">
            <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm w-full">
            <span class="bg-white dark:bg-black px-2 text-gray-500">{props.children}</span>
        </div>
    </div>
}
export type StorePair<T> = [T, SetStoreFunction<T>]
const ax = createSignal<{ [key: string]: boolean }>({})
export type KeyValue = [string, string]
export type KeyValueMap = {
    [key: string]: any
}
export type DecisionMap = {
    [key: string]: string
}
// probably make this generic, not requrire number.
export const CheckboxSet: Component<{
    opts: KeyValue[],
    value: DecisionMap,
    setValue: (x: string, y: number) => void
}> = (props) => {
    const setAll = (v: number) => {

        for (let x of props.opts) {
            props.setValue(x[0], v)
        }

    }

    return <>
        <div class='flex mb-2 space-x-4 font-medium'><Bb onClick={() => { setAll(1) }}>ALL</Bb>  <Bb onClick={() => { setAll(0) }}>NONE</Bb></div>
        <fieldset>
            <For each={props.opts}>{(e, i) => {
                return <Checkbox
                    checked={() => props.value[e[0]] == "1"}
                    onChange={(x: boolean) => { props.setValue(e[0], x ? 1 : 0) }} >
                    {e[1]}</Checkbox>
            }}</For>

        </fieldset>
    </>
}


export const Select: Component<{
    opts: KeyValue[]
    value: Signal<string>
}> = (props) => {
    const [value, setValue] = props.value
    console.log("select", props.opts, props.value[0]())
    return (<div class='flex  text-black dark:text-white rounded-md items-center '>
        <select
            id='ln'
            value={value()}
            aria-label="Select language"
            class='flex-1  rounded-md dark:bg-neutral-900 text-black dark:text-white '
            oninput={(e) => {
                setValue(e.currentTarget.value)
            }}
        >
            {props.opts.map(([code, name]) => (
                <option value={code}>
                    {name}&nbsp;&nbsp;&nbsp;
                </option>
            ))}
        </select>
    </div>
    );
};
//       <!-- Current: "text-gray-900", Default: "text-gray-500 hover:text-gray-700" -->
export const Segment: Component<{
    option: KeyValue[],
    value: string,  // can't really be any, its used as key in a map
    onChange: (_: any) => void
}> = (props) => {
    const ln = useLn()

    const onClick = (k: string) => {
        console.log("click", k)
        props.onChange(k)
    }
    const selected = (x: boolean) => "block text-center flex-1 rounded-md px-3 py-2 text-sm font-medium " + (x ? "bg-gray-100 text-gray-700" : "text-gray-500 hover:text-gray-700")
    return <div>
        <div class="hidden sm:block">
            <nav class="isolate flex rounded-lg shadow" aria-label="Tabs">
                <For each={props.option}>{(e: KeyValue, i) => {
                    let [k, desc] = e
                    return <a href="#"
                        onClick={() => onClick(k)}
                        class={selected(k == props.value)}
                        aria-current="page">{desc}</a>
                }}</For>
            </nav>
        </div>
    </div>
}
/*
<Checkbox
                    checked={() => props.value[e[0]] ==1}
                    onChange={(x: boolean) => { props.setValue(e[0], 1) }} >
                    {e[1]}</Checkbox>*/

export interface TernarySetProps {
    opts: KeyValue[],
    value: Store<DecisionMap>,  // intended to be a proxy from createstore
    setValue: (x: string, y: string) => void
}
export function TernarySet(props: TernarySetProps) {
    const setAll = (v: string) => {
        for (let x of props.opts) {
            props.setValue(x[0], v)
        }
    }
    // when should this be called? when the value changes? any props?
    createEffect(() => {
        console.log("ternary set", props.value)
    })

    const val = (k: string) => {
        return props.value[k]
    }
    const setVal = (k: string, v: string) => {
        console.log("setval", k, v)
        props.setValue(k, v)
    }
    // this is called every time its mounted by disclosure.
    return <>
        <div class='flex mb-2 space-x-4 font-medium'>
            <div>Set All:</div>
            <div ><Bb onClick={() => { setAll("1") }}>YES</Bb></div>
            <div><Bb onClick={() => { setAll("0") }}>NO</Bb></div>
            <div ><Bb onClick={() => { setAll("-1") }}>ALLOW</Bb></div></div>
        <fieldset class='space-y-2'>
            <For each={props.opts}>{(e, i) => {
                const [k, v] = e
                return <div class='flex items-center'>
                    <div class='w-48'><Segment option={[
                        ["1", 'Yes'],
                        ["0", 'No'],
                        ["-1", 'Allow']
                    ]}
                        value={val(k)}
                        onChange={(v) => setVal(k, v)} /></div>
                    <div class='ml-6'>{e[1]}  </div></div>
            }}</For>
        </fieldset>
    </>
}

export const Heading: Component<{ children: string, title: string }> = (props) => {
    return <><label class="text-base font-semibold text-gray-900">{props.title}</label>
        <p class="text-sm text-gray-500">{props.children}</p></>
}


export const RadioGroup: Component<{ opts: KeyValue[], value: Signal<string> }> = (props) => {
    const [value, setValue] = props.value
    const ch = (e: Event) => {
        setValue((e.target as HTMLInputElement).name)
    }
    return <div>

        <fieldset class="">
            <div class="space-y-4">
                <For each={props.opts}>{(e, i) => {
                    const [k, v] = e
                    return <div class="flex items-center">
                        <input name={k} type="radio" checked={value() == k} class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600" onChange={ch} />
                        <label for="email" class="ml-3 block text-sm font-medium leading-6 text-gray-900 dark:text-neutral-400">{v}</label>
                    </div>
                }}</For>

            </div>
        </fieldset>
    </div>
}

export const P = (props: { children: JSX.Element, class?: string }) => {
    return <p class={`dark:text-neutral-400 ${props.class} `}>{props.children} </p>
}

// input + some buttons on the right
export const InputButton = (props: {
    onClick: () => void,
    buttonLabel?: string,
    children: JSX.Element
}) => {
    return <div class='w-full flex items-center space-x-2 '>
        <div class='flex-1'>
            {props.children}</div>
        <div class='w-16'><LightButton onClick={props.onClick}>{props.buttonLabel ?? "Test"}</LightButton></div></div>
}
