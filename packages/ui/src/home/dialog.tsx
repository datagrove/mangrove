import { Icon } from "solid-heroicons"
import { arrowUp, arrowUpCircle, xMark } from "solid-heroicons/solid"
import { SearchBox } from "./search"
import { For, JSXElement, Show, createResource, createSignal } from "solid-js"
import { SiteRef } from "../db"

export interface FilterSet {
    name: string   // translate
    type: "radio" | "check"
    values: string[]
}



// return a function that can continually resolve searches close to a previous search.


// a search might start with a view name and a prefix, and then return the facets that are available.

export interface FacetSelect<T> {
    prefix: string
    offset?: number
    limit?: number
    facets?:  { [key: string]: boolean }
}

export interface SearchableView<T> {
    search: (x: FacetSelect<T>) => Promise<T[]>
    facets: FilterSet[]
}



export interface SearchProps<T> extends FacetSelect<T> {
    view: SearchableView<T>
    label: string | JSXElement
    children: (item: T) => JSXElement
}
export type Searcher<T> = () => Promise<T[]>
// selection lists will often have chip lists.
export  function SelectionList<T>(props: SearchProps<T>) {
    const [prefix, setPrefix] = createSignal(props.prefix)
    // resource, need to mutate whenever prefix changes.
    const [res] = createResource(prefix(), async (s: string) => props.view.search({...props, prefix: s}))
    return <>
        <div class='w-full h-full flex flex-col'>
        <div><SearchBox /></div>
        <div class='flex-grow overflow-auto'>
        <For each={res() }>{ (e,i) => {
            return props.children(e)
        }}</For></div>
        </div>
    </>
}





type IconPath = typeof xMark
// should modals be routes?
export function ModalButton(props: { text: string, onClick: () => void, path: IconPath, }) {
    return <button onClick={props.onClick}><div class='flex flex-col items-center justify-center space-y-2'>
        <div class=' bg-neutral-500 rounded-full p-2'><Icon path={props.path} class='block w-6 h-6' /></div>
        <div>{props.text}</div>
    </div></button>
}

// zip
export function UploadButton(props: { onClick?: () => void }) {
    let el: HTMLInputElement

    const upload = () => {
        const files = el.files;

        if (files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(file.name);
            }
        }
    }
    return <label for="upload">
        {/* @ts-ignore */}
        <input ref={el} id='upload' class='hidden' onChange={upload} type="file" multiple directory webkitdirectory />
        <div class='flex flex-col items-center justify-center space-y-2'>
            <div class=' bg-neutral-500 rounded-full p-2'><Icon path={arrowUp} class='block w-6 h-6' /></div>
            <div>{"Upload"}</div>
        </div></label>
}
export function Modal(props: { class?: string,children?: any , when?: boolean}) {
    return <Show when={props.when}><div class={props.class}><div class='fixed  z-50 top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center'>
        <div class='max-w-md rounded-xl border-1 shadow-xl border-white bg-white dark:bg-neutral-900 p-2'>{props.children}</div>
    </div></div></Show>
}

export function Text(props: { children?: any, onClick?: () => void }) {
    return <button onClick={props.onClick} class='text-blue-700 hover:underline hover:text-blue-600'>{props.children}</button>
}


export function ModalTitle(props: { 
    children?: any 
    onOk? : () => void
    onCancel?: () => void}) {
    return <div class='flex justify-between items-center mb-6'>
        <div>{ props.onOk && <Text onClick={props.onOk}>Ok</Text> }</div> 
        <div class='text-xl  font-bold'>{props.children}</div>
        <div>{ props.onCancel && <Text onClick={props.onCancel}>Cancel</Text> }</div>
    </div>
}
export function ModalBody(props: { children?: any, class?: string }) {
    return <div class={`${props.class} flex-grow`}>{props.children}</div>
}

export function ListTile(props: { children?: any, onClick?: () => void }) {
    return <div><button onClick={props.onClick}>{props.children} </button></div>
}