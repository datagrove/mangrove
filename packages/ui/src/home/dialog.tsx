import { Icon } from "solid-heroicons"
import { arrowUp, arrowUpCircle, xMark } from "solid-heroicons/solid"
import { SearchBox } from "./search"
import { For, JSXElement, createResource, createSignal } from "solid-js"

export interface FilterSet {
    name: string   // translate
    type: "radio" | "check"
    values: string[]
}

export type Facets = { [key: string]: boolean }

export interface SearchProps<T> {
    label: string | JSXElement
    search: (x:SearchProps<T>) => Promise<T[]>
    prefix: string
    offset?: number
    limit?: number
    facets?: Facets
    filters?: FilterSet[]
    children: (item: T) => JSXElement
}
export type Searcher<T> = () => Promise<T[]>
// selection lists will often have chip lists.
export  function SelectionList<T>(props: SearchProps<T>) {
    const [prefix, setPrefix] = createSignal(props.prefix)
    // resource, need to mutate whenever prefix changes.
    const [res] = createResource(prefix(), async (s: string) => props.search({...props, prefix: s}))
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

export function PickDialog() {

}

// Popup a search dialog box if the selection is tapped
export function ComboBox<T>(props: SearchProps<T>) {
    const [prefix, setPrefix] = createSignal(props.prefix)
    // resource, need to mutate whenever prefix changes.
    const [res] = createResource(prefix(), async (s: string) => props.search({...props, prefix: s}))
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
export function Modal(props: { children?: any }) {
    return <div class='fixed  z-50 top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center'>
        <div class='w-1/2 h-1/2 rounded-xl border-1 shadow-xl border-white bg-white dark:bg-neutral-700 p-2'>{props.children}</div>
    </div>
}

export function Text(props: { children?: any, onClick?: () => void }) {
    return <button onClick={props.onClick} class='text-blue-700 hover:underline hover:text-blue-600'>{props.children}</button>
}

export function Button(props: { children?: any, onClick?: () => void }) {
    return <button onClick={props.onClick} class='bg-neutral-500 hover:bg-neutral-600 text-white font-bold py-2 px-4 rounded'>{props.children}</button>
}
export function ModalTitle(props: { 
    children?: any 
    onOk? : () => void
    onCancel?: () => void}) {
    return <div class='flex justify-between items-center'>
        <div>{ props.onOk && <Button onClick={props.onOk}>Ok</Button> }</div> 
        <div class='text-xl  font-bold'>{props.children}</div>
        <div>{ props.onCancel && <Button onClick={props.onCancel}>Cancel</Button> }</div>
    </div>
}
export function ModalBody(props: { children?: any }) {
    return <div class='flex-grow'>{props.children}</div>
}

export function ListTile(props: { children?: any, onClick?: () => void }) {
    return <div><button onClick={props.onClick}>{props.children} </button></div>
}