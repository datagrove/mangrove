import { For, Show, Signal, createSignal } from "solid-js"
import { ListTile, Modal, Text, ModalBody, ModalButton, ModalTitle, SearchProps, SelectionList, UploadButton, SearchableView } from "./dialog"
import { arrowUp } from "solid-heroicons/solid"
import { H2 } from "../layout/nav"
import { FacetSelect, SiteRef, db } from "../db"
import { SearchBox } from "./search"


// Pick Group

// should be HOC, that returns { Dialog(), picker()}
// [ Dialog, picker ] = createDialog<Props,Result>( ()=>{ }, searcher? )
export type Dialog<Props, Result> = [props: Props, resolve: (result: Result) => void]|undefined
const [showGroupPicker, setShowGroupPicker] = createSignal<Dialog<SiteRef,SiteRef>>()
async function groupPicker(group: SiteRef): Promise<SiteRef> {
    return new Promise((resolve, reject) => {
        // dialogs can take parameters, and a setter with result
        setShowGroupPicker([group, resolve])
    })
}
export const searchWritableGroups : SearchableView<SiteRef> = {
    search: async (x: FacetSelect<any>): Promise<SiteRef[]> => {
            return [
                { name: "Private", did: "" },
                { name: "Public", did: "" },
            ]
    },
    facets: []
}

// a modal to pick a group
export const PickGroupModal = () => {
    const resolve = (x: SiteRef) => showGroupPicker()![1](x)
    return <Show when={showGroupPicker()}><Modal>
        <ModalTitle onCancel={()=>resolve(showGroupPicker()![0])}>Pick Group</ModalTitle>
        <ModalBody>
        <div class='flex flex-col space-y-2'>
        <SelectionList
            prefix=""
            label="Groups"
            view={searchWritableGroups}
        >
           { e=> <ListTile>Private</ListTile> }
            </SelectionList>
        </div>       
        </ModalBody>
        </Modal></Show>
}

interface PickerProp<T> {
    value: T
    onChange: (x: T) => void
}
export function GroupPicker(props: PickerProp<SiteRef>) {
     const pickGroup = async () => {
        props.onChange( await groupPicker(props.value))
    }
    return <div>Upload to <Text onClick={pickGroup}> {props.value.name}</Text></div>
}

///////////////////
// drop file dialog
export interface DropProps {
    files: FileList
    group: SiteRef   // this is the default 
}
export const [showDrop, setShowDrop] = createSignal<Dialog<DropProps,void>>()
// can we make this async? Is that more organized?
export async function uploadFiles(fl: FileList, group: SiteRef) {
    return new Promise((resolve, reject) => {
        setShowDrop([{
            files: fl,
            group: group
        }, resolve])
    })
}

export function DropModal() {
    const [group,setGroup] = createSignal<SiteRef>({name:"Private", did:""})
    const upload = () => {
        db()!.uploadFiles(showDrop()![0].files!, showDrop()![0].group!.did)
    }
    const fileList = () => showDrop()![0].files;
    const fileNames = () => Array.from(fileList() || []).map((file) => file.name);

    const pickGroup = async () => {
        setGroup( await groupPicker(group()))
    }
    return <Show when={showDrop()}>
        <Modal>
            <ModalTitle onOk={upload} onCancel={()=>setShowDrop(undefined)}>Upload Files</ModalTitle>
            <ModalBody>
                <GroupPicker value={recentGroup()} onChange={setRecentGroup}/>
            {showDrop()![0].files?.length ?? 0} files to upload
            <For each={fileNames()}>{ (e,i) => {
                return <div>{e}</div>
            }}</For>
            </ModalBody>
        </Modal>
    </Show>
}

// all files are associated with a group/site that can read and maybe write files in the group

// we have standard groups of public and private
// 

// what about categories of results?



// new file dialog
export const [showNew, setShowNew] = createSignal(false)

export async function pickNewFile() {
    return new Promise((resolve, reject) => {
        setShowNew(true)
    })
}
const [recentGroup,setRecentGroup] = createSignal<SiteRef>({ name: "Private", did: "" })

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

    return <Modal when={showNew()}>
            <ModalTitle onCancel={()=>setShowNew(false)}>New Page</ModalTitle>
            <ModalBody class='space-y-6'>
            <GroupPicker value={recentGroup()} onChange={setRecentGroup} />
                <div class='flex flex-wrap space-x-2'>
                    
                    <UploadButton />
                    <ModalButton onClick={upload} path={arrowUp} text="Page" />
                    <ModalButton onClick={upload} path={arrowUp} text="Folder" />
                </div>
            </ModalBody>
        </Modal>
    

}