import { For, Show, createSignal } from "solid-js"
import { ListTile, Modal, Text, ModalBody, ModalButton, ModalTitle, SearchProps, SelectionList, UploadButton } from "./dialog"
import { arrowUp } from "solid-heroicons/solid"
import { H2 } from "../layout/nav"
import { SiteRef, db } from "../db"
import { SearchBox } from "./search"



// all files are associated with a group/site that can read and maybe write files in the group

// we have standard groups of public and private
// 

// what about categories of results?
async function writableGroups(props: SearchProps<SiteRef>): Promise<SiteRef[]> {
    return [
        { name: "Private", did: "" },
        { name: "Public", did: "" },
    ]
}

export interface DropProps {
    files: FileList
    group: SiteRef   // this is the default 
}
export const [showDrop, setShowDrop] = createSignal<DropProps | undefined>(undefined)
export const [showNew, setShowNew] = createSignal(false)

export type Dialog<Props, Result> = [props: Props, resolve: (result: Result) => void]|undefined
const [showGroupPicker, setShowGroupPicker] = createSignal<Dialog<SiteRef,SiteRef>>()

// a modal to pick a group
export const PickGroupModal = () => {
    const resolve = (x: SiteRef) => showGroupPicker()![1](x)
    return <Show when={showGroupPicker()}><Modal>
        <ModalTitle onCancel={()=>resolve(showGroupPicker()![0])}>Pick Group</ModalTitle>
        <ModalBody>
        <div class='flex flex-col space-y-2'>
        <SelectionList
            prefix=""
            label='Write to Group'
            search={writableGroups}
        >
           { e=> <ListTile>Private</ListTile> }
            </SelectionList>
        </div>       
        </ModalBody>
        </Modal></Show>
}

// from drop files; we off a chance to set the group
// we might have dropped it on the group reference, then that should be the default

// can we make this async? Is that more organized?
export function uploadFiles(fl: FileList, group: SiteRef) {
    setShowDrop({
        files: fl,
        group: group
    })
}

async function groupPicker(group: SiteRef): Promise<SiteRef> {
    return new Promise((resolve, reject) => {
        // dialogs can take parameters, and a setter with result
        setShowGroupPicker([group, resolve])
    })
}

export function DropModal() {
    const [group,setGroup] = createSignal<SiteRef>({name:"Private", did:""})
    const upload = () => {
        db()!.uploadFiles(showDrop()!.files!, showDrop()!.group!.did)
    }
    const fileList = () => showDrop()?.files;
    const fileNames = () => Array.from(fileList() || []).map((file) => file.name);

    const pickGroup = async () => {
        setGroup( await groupPicker(group()))
    }
    return <Show when={showDrop()}>
        <Modal>
            <ModalTitle onOk={upload} onCancel={()=>setShowDrop(undefined)}>Upload Files</ModalTitle>
            <ModalBody>
                <div>Upload to <Text onClick={pickGroup}> { showDrop()!.group.name }</Text></div>
            {showDrop()?.files?.length ?? 0} files to upload
            <For each={fileNames()}>{ (e,i) => {
                return <div>{e}</div>
            }}</For>
            </ModalBody>
        </Modal>
    </Show>
}
export function NewModal() {
    // we could pick a template or a group, similar dynamic?

    const [group, setGroup] = createSignal<SiteRef>({ name: "Private", did: "" })
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
            <Show when={!showGroupPicker()} >

                <div class='flex flex-wrap space-x-2'>
                    <div>
                        <ListTile >{group()}</ListTile>
                    </div>
                    <div></div>
                    <UploadButton />
                    <ModalButton onClick={upload} path={arrowUp} text="Page" />
                    <ModalButton onClick={upload} path={arrowUp} text="Folder" />

                </div></Show>
        </Modal>
    </Show>

}