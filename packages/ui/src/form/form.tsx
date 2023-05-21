import { For, Match, Show, Switch, createResource, createSignal } from "solid-js"
import { Cell, CellOptions } from "../db/cell"
import { useNavigate } from "@solidjs/router"
import { SiteDocumentRef, usePage } from "../core"
import { InputCell } from "../lib/input"


// cell = new Cell(celloptions, table, primarykey, database)
// cell = new Cell(celloptions, getter, setter)


// a loaded form acts like an updateable view.
// we can 

// maybe this takes a map of cell options and returns a map of cells
// there is a single RMW function for entire list?




interface FormCell<T> {
    type: "cell"
    cell: Cell
}
interface FormCandy {
    type: "candy"
}
type FormField = FormCell<any> | FormCandy


class LoadedForm {
    pageCount = 1
    all: FormField[] = []
    current: FormField[] = []

    constructor(field: FormField[] = []) {

    }
}
export function createForm(field: FormField[]): LoadedForm {
    const r = new LoadedForm()
    r.all = field
    return r

}



export function fcell<T>(cell: Cell, options: CellOptions): FormCell<T> {
    return {
        type: "cell",
        cell:  cell
    }
}
export function fcandy(type: "submit" | "cancel"): FormCandy {
    return {
        type: "candy"
    }
}

// dynamic user edited




export interface FormProps {
    page?: number
    form: LoadedForm
}
export function Form(props: FormProps) {
    const { form, page } = props
    // should suspense and error boundaries handle these? make them here?
    return <form>
        <FormHeader form={form} />
        <For each={form.current}>{(e, i) => {
            return <Switch>
                <Match when={e.type === "cell"}>
                    <InputCell cell={(e as FormCell<any>).cell} />
                </Match>
                <Match when={e.type === "candy"}>
                    <div></div>
                </Match>
            </Switch>
        }}</For>
        <FormFooter form={form} />
    </form>
}

function FormHeader(props: { form: LoadedForm }) {
    return <div></div>
}
function FormFooter(props: { form: LoadedForm }) {
    return <div></div>
}


// when someone sharea a position, like a page, that position can be transformed.
// potentiall a (position,timestamp) is sufficient. you could also use unique keys?
// should you use the cell as a location? if the cell is deleted, then you are lost.
// potentially cell and timestamp is best, you can find the cell without transformaing and fall back to findig 
// the cell in history. we would need to cache a

// a form could be a saga, with transactions to save state, but one final transaction to execute or cancel
// cells would point to the temporary state

// hash[0] = viewer (could be a version of form viewer))
// hash[1] = flyout
// hash[3] = form page