import { Component, JSXElement, Show, createSignal } from "solid-js"


export const FieldSet: Component<{children: JSXElement}> = (props) => {
    return <fieldset class="relative flex items-start ">
        <div class='space-y-5'>{props.children}</div></fieldset>
}

export const Checkbox: Component<{
    children: JSXElement,
    title: string, 
    value: ()=>boolean, setValue: (checked: boolean) => void}> = (props) => {
    return     <div class="relative flex items-start">
    <div class="flex h-6 items-center">
      <input checked={props.value()} id="comments" aria-describedby="comments-description" onInput={()=>props.setValue(!props.value())} name="comments" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-200 focus:ring-indigo-600"/>
    </div>
    <div class="ml-3 text-sm leading-6">
      <label for="comments" class="font-medium dark:text-white text-gray-900">{props.title}</label>
      <p id="comments-description" class="text-gray-500">{props.children}</p>
    </div>
    </div>
    
}

export const ToggleSection: Component<{ 
    children: JSXElement, 
    header: string, }> = (props) =>
    {
        const [show,setShow] = createSignal(false)
    return <div>
        <button class='text-indigo-600 hover:text-blue-500 hover:underline' onClick={()=>setShow(!show())} >{props.header}</button>
        <Show when={show()}>{props.children}</Show>
    </div>
       
}


export const Center: Component<{ children: JSXElement }> = (props) => {
    return <div class="grid place-items-center h-screen">
        <div class='w-96'>
            {props.children}
        </div></div>
}

export const BlueButton: Component<{ onClick: (e: any) => void, children: JSXElement, disabled?: boolean }> = (props) => {
    return <button disabled={props.disabled} onClick={props.onClick} class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">{props.children}</button>
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
        <input type={props.type??"text"} value={props.value} autofocus={props.autofocus} onInput={(e) => {
            if (props.onInput) props.onInput((e.target as HTMLInputElement).value)
        }} id={props.name} 
            onchange={(e) => {
                if (props.onInput)
                    props.onInput((e.target as HTMLInputElement).value)
            }} placeholder={props.placeholder} class="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 disabled:opacity-50 focus:border-indigo-500" /></div>
}
export const TextDivider: Component<{ children: string }> = (props) => {
    return <div class="relative mt-4">
        <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
            <span class="bg-white dark:bg-black px-2 text-gray-500">{props.children}</span>
        </div>
    </div>
}
