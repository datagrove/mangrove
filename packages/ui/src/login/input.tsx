import { Component, createEffect, createSignal, onCleanup } from "solid-js"



export interface StepState<T, V, Cl> {
    value: V
    predicted: V
    proposals: T[]
    gsn: number
    lsn: number    // local edits s

    // committers specific values are part of the state; eg. we may share the location of the cursor.
    committer: { [key: number]: Cl }
}
// committers may need to rebase based on steps they missed.
class Committer {

}
// we can have multiple committers, only one canonical (sets gsn, forces trim)
// on each commit we should have the most recent local prediction.
function commit<T, V, Cl>(x: StepState<T, V, Cl>, stream: number, o: T) {

}

function updateState<T, V, Cl>(x: StepState<T, V, Cl>, o: StepTx<T>) {

}

// takes a listener and returns a writer.
function openStepState<T, V>(x: StepState<T, V>, reader: () => void) {
    return 1 // return stream.
}

function closeStepState<T, V>(x: StepState<T, V>, o: T) {

}


export interface StepTx<T> {
    value: T[]
    gsn: number
    lsn: number    // local edits s
}

// we need to listen to more than just steps; we need to know success and failure of local operations.
export interface StepValue<T> {
    listen(f: (v: T[]) => void): void
    write(v: T[]): void
}

export interface EditorState {
}
export interface Editor<T> {
    el: HTMLInputElement
    key: StepValue<T>
    state: EditorState
}
type Plugin<T> = (e: Editor<T>) => void

type LWW = StepValue<string>

const createEditor = (key: StepValue, plugins?: Plugin[]) => {
    let el: HTMLInputElement | null = null
    // steps from listen are canonical
    key.listen((v) => {
        el!.value = v.
    })
    const onInput = (e: any) => {
        // steps from dom are proposals
        key.write([])
    }
    createEffect(() => {
        el!.addEventListener("oninput", onInput)
    })
    onCleanup(() => el!.removeEventListener("oninput", onInput));
    const ed: Editor = {
        el: el!,
        key: key,
        state: {}
    }
    return [edref, ed] as const

}


// update needs to merge the editor with the dom: Data, Selection
// call when the step changes, call when 
export const updateEditor = (e: Editor, tx: Tx) => {

}
declare module "solid-js" {
    namespace JSX {
        interface Directives {  // use:model
            editor: StepValue;
        }
    }
}

function edref(el: HTMLInputElement) {
}
function valid(ed: Editor) {
    return true
}

export const Inputx: Component<{ key: StepValue }> = (props) => {
    const [edref, ed] = createEditor(props.key, [])
    return <div><input ref={edref} />
        <div>valid: {valid(ed)}</div>
    </div>
}
// how do I create step values?

function svm(): StepValue {
    return {
        listen: (f) => {
            f([])
        }
        , write: (v) => {
        }
    }
}
let r = {
    first: svm()
}

// 

/*
// create a transaction from the 
const updateDom = (e: Editor, el: HTMLInputElement) => {
    const tx: Tx = {

    }
    return tx
}
const fx = (el: any) => {
}
    const  ed = createEditor(db, props.key)

    let el: HTMLInputElement | null = null
    createEffect(() => {
        ed(el!)
    })
*/