import { Show, createSignal } from "solid-js"
import { ListTile, Modal, ModalButton, UploadButton } from "./dialog"
import { arrowUp } from "solid-heroicons/solid"
import { H2 } from "../layout/nav"
import { db } from "../db"

export interface DropProps {
    files?: FileList
    group?: SiteRef
}
export const [showDrop, setShowDrop] = createSignal<DropProps|undefined>(undefined)
export const [showNew, setShowNew] = createSignal(false)
const [showGroupPicker, setShowGroupPicker] = createSignal(false)
const PickGroup = () => {
    return <div class='flex flex-col space-y-2'>
        <H2>Pick group</H2>
        <button onClick={()=>setShowGroupPicker(false)}>OK</button>
        </div>
        }

// from drop files; we off a chance to set the group
// we might have dropped it on the group reference, then that should be the default

// can we make this async? Is that more organized?
export function uploadFiles(fl: FileList,group?: SiteRef) {
    setShowDrop({
        files:fl,
        group:group
    })

}

export interface SiteRef {
    name: string
    did: string
}
export function DropModal() {
    const upload = () => {
        db()!.uploadFiles(showDrop()!.files!,showDrop()!.group!.did)
    }
    return <Show when={showDrop()}>
        <Modal>
            {showDrop()?.files?.length??0} files to upload
            <PickGroup/>
            <button onClick={()=>setShowDrop(undefined)}>Cancel</button>
            <button onClick={()=>upload}>OK</button>
        </Modal>
    </Show>
}
export function NewModal() {
    // we could pick a template or a group, similar dynamic?

    const [group,setGroup] = createSignal<SiteRef>({name:"Private",did:""})
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
            <Show when={!showGroupPicker()} fallback={PickGroup()}>
                
            <div class='flex flex-wrap space-x-2'>      
            <div>
                <ListTile onClick={()=>setShowGroupPicker(true)} >{group() }</ListTile>
            </div>
            <div></div>        
            <UploadButton/>
            <ModalButton onClick={upload} path={arrowUp} text="Page" />
            <ModalButton onClick={upload} path={arrowUp} text="Folder" />
            
            </div></Show>
        </Modal>
        </Show>

}