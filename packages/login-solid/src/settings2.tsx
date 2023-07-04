import { DisclosureButton, DisclosurePanel } from "solid-headless";
import { JSX, Component, createSignal, JSXElement } from "solid-js";
import { BlueButton, LightButton } from "../lib/form";


export function ChevronUpIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 15l7-7 7 7"
            />
        </svg>
    );
}
export const Db = (props: { children: JSX.Element }) => {
    return <DisclosureButton as="div" class="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-neutral-900 bg-neutral-100 rounded-lg hover:bg-neutral-200 focus:outline-none focus-visible:ring focus-visible:ring-neutral-500 focus-visible:ring-opacity-75">
        {({ isOpen }) => (
            <>
                {props.children}
                <ChevronUpIcon
                    class={`${isOpen() ? 'transform rotate-180' : ''} w-5 h-5 text-neutral-500`}
                />
            </>
        )}
    </DisclosureButton>
}
export const Dp = (props: { children: JSX.Element }) => {
    return <DisclosurePanel class="px-2 mt-2 pt-2 space-y-2  text-sm text-gray-500">
        {props.children}
    </DisclosurePanel>
}

export const ButtonSet = (props: { children: JSX.Element[] }) => {
    return <div class='flex space-x-4'>
        {props.children}
    </div>
}
export interface ButtonProps {
    autofocus?: boolean
    onClick: () => void
    children: JSX.Element
}
export const Bs1 = (props: ButtonProps) => {
    return <div class='w-24'><BlueButton {...props} /></div>
}
export const Bs = (props: ButtonProps) => {
    return <div class='w-24'><LightButton {...props} /></div>
}
export const BareCheckbox: Component<any> = (props) => {
    const [checked, setChecked] = createSignal(props.checked)
    const toggle = () => setChecked(!checked())
    // Enabled: "bg-indigo-600", Not Enabled: "bg-gray-200" -
    const bclass = () => `${checked() ? "bg-indigo-600" : "bg-gray-200"} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`
    return (
        <button {...props} onClick={toggle} type="button" class={bclass()} role="switch" aria-checked="false">
            <span class="sr-only">Use setting</span>
            {/* Enabled: , Not Enabled: "translate-x-0" */}
            <span class={`${checked() ? "translate-x-5" : "translate-x-0"} pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}>
                {/*  Enabled: , Not Enabled: "opacity-100 duration-200 ease-in" */}
                <span class={`${checked() ? "opacity-0 duration-100 ease-out" : "opacity-100 duration-200 ease-in"} absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`} aria-hidden="true">
                    <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                        <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </span>
                {/* Enabled: "opacity-100 duration-200 ease-in", Not Enabled: "opacity-0 duration-100 ease-out" */}
                <span class={`${checked() ? "opacity-100 duration-200 ease-in" : "opacity-0 duration-100 ease-out"} absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`} aria-hidden="true">
                    <svg class="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                    </svg>
                </span>
            </span>
        </button>
    );
};
export const Checkbox: Component<{ children: JSXElement, checked?: boolean, onClick?: () => void }> = (props) => {
    return <div class='flex items-center space-x-2'><div><BareCheckbox checked={props.checked} onClick={props.onClick} /></div> <div class='text-neutral-400 text-sm font-medium'>{props.children}</div></div>
}
// we should have loginInfo here, since we must be logged in for this to make sense.
// but we could have moved away from the page, so we need to use the login cookie or similar to restore the login info. We can keep everything in sessionStorage? It depends on how we want to manage logins, if we want to log back in without challenge then we need to keep in localStorage.
// must use cbor to get uint8array

