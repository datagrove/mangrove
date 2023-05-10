import { ButtonProps } from "solid-headless"
import { Accessor, Component, For, JSX, JSXElement, ParentComponent, Show, Signal, createSignal } from "solid-js"
import { Bb } from "../layout/nav"


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
            <input checked={props.checked()} id="comments" aria-describedby="comments-description" onInput={() => props.onChange(!props.checked())} name="comments" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-200 focus:ring-indigo-600" />
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
    return <button {...props} disabled={props.disabled} onClick={props.onClick} class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 disabled:opacity-50">{props.children}</button>
}
export const LightButton: Component<ButtonProps> = (props) => {
    return <button {...props} disabled={props.disabled} onClick={props.onClick} class="flex w-full justify-center rounded-md bg-neutral-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">{props.children}</button>
}
export const Input: Component<{
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
export const TextDivider: Component<{ children: string }> = (props) => {
    return <div class="relative mt-4 w-full">
        <div class="absolute inset-0 flex items-center w-full">
            <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm w-full">
            <span class="bg-white dark:bg-black px-2 text-gray-500">{props.children}</span>
        </div>
    </div>
}

const ax = createSignal<{ [key: string]: boolean }>({})
export type KeyValue = [string, string]
export type StringSet = Signal<{ [key: string]: boolean }>
export const CheckboxSet: Component<{ 
    opts: KeyValue[], 
    value: StringSet,
     }> = (props) => {
    const [value, setValue] = props.value

    const set = (key: string, v: boolean) => {
        setValue({
            ...value(),
            [key]: v
        })
    }

    const setAll = (v: boolean) => {
        const o : {[key:string]:boolean} = {}
        for (let x of props.opts) {
            o[x[0]] = v
        }
        setValue(o)
    }

    return <>
        <fieldset>
            
            <For each={props.opts}>{(e, i) => {
                return <Checkbox 
                    checked={() => value()[e[0]]} 
                    onChange={(x: boolean) => {  set(e[0],x)}} >
                        {e[1]}</Checkbox>
            }}</For>
            <Bb onClick={() => { setAll(true)}}>All</Bb>  <Bb onClick={() => {setAll(false) }}>None</Bb>
            </fieldset>
    </>
}

export const Select: Component<{
    opts: KeyValue[]
    value: Signal<string> 
} > = (props) => {
    const [value, setValue] = props.value
    console.log("select", props.opts, props.value[0]())
    return (<div class='flex  text-black dark:text-white rounded-md items-center '>
        <select
            id='ln'
            value={value()}
            aria-label="Select language"
            class='flex-1  rounded-md dark:bg-neutral-900 text-black dark:text-white '
            oninput={(e) => {
                setValue( e.currentTarget.value)
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

export const Radio = (props: { name?: string,  checked: ()=>boolean, onChange: (x: boolean) => void }) => {
    return   <div class="flex items-center">
        <input id="email" name="notification-method" type="radio" checked class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"/>
        <label for="email" class="ml-3 block text-sm font-medium leading-6 text-gray-900 dark:text-neutral-400">{props.name}</label>
      </div>
}

export const Heading: Component<{ children: string, title: string  }> = (props) => {
    return <><label class="text-base font-semibold text-gray-900">{props.title}</label>
    <p class="text-sm text-gray-500">{props.children}</p></>
}

export const RadioGroup: Component<{opts: string[]}> = (props) => {
  return <div>
        
        <fieldset class="">
            <legend class="sr-only">Notification method</legend>
            <div class="space-y-4">
                <For each={props.opts}>{(e, i) => {
                    return <Radio name={e} checked={() => true} onChange={(x: boolean) => { }}/>
                }}</For>

            </div>
        </fieldset>
        </div>
}

