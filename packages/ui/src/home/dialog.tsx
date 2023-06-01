import { Icon } from "solid-heroicons"
import { arrowUp, arrowUpCircle, xMark } from "solid-heroicons/solid"

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

export function ListTile(props: { children?: any, onClick?: () => void }) {
    return <div><button onClick={props.onClick}>{props.children} </button></div>
}