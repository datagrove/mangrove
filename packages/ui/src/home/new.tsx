import { Show, createSignal } from "solid-js"
import { Modal, ModalButton, UploadButton } from "./dialog"
import { arrowUp } from "solid-heroicons/solid"

export const [showNew, setShowNew] = createSignal(false)
export function NewModal() {
    const upload = () => {
        setShowNew(false)
    }
    const newPage = () => {
        setShowNew(false)
    }
    const newFolder = () => {
        setShowNew(false)
    }
    return <Show when={showNew()}>
        <Modal>
            <div class='flex flex-wrap space-x-2'>              
            <UploadButton/>
            <ModalButton onClick={upload} path={arrowUp} text="Page" />
            <ModalButton onClick={upload} path={arrowUp} text="Folder" />
            </div>
        </Modal>
        </Show>

}