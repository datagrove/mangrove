import { For, Match, Show, Switch, createResource, createSignal } from "solid-js"
import { Cell, CellOptions } from "../db/client"
import { useNavigate } from "@solidjs/router"
import { SiteDocumentRef, usePage } from "../core"
import { InputCell } from "../lib/input"
import { Input } from "postcss"

// cell = new Cell(celloptions, table, primarykey, database)
// cell = new Cell(celloptions, getter, setter)
export interface Form {
    layout: CellOptions[]
}
class Lens<T = any> {
    constructor() {

    }

    addListener(fn: (v: T) => void) {

    }
    set(v: T) {

    }
}

export interface Document {
    created: Date
    updated: Date
    finished: Date
    deprecated: Date
}
// the filled form has a status that can show if it has to be made immutable. (might be irrelevant)
export interface FilledForm extends Document {
    form: Form  // immutable
    values: {
        [key: string]: any
    }
}

// a loaded form acts like an updateable view.
// we can 
export interface ColumnMap {
    [key: string]: ColumnDb
}
// potentially just string? 
export interface ColumnDb {
    type?: string
}


type LensMap<T> = {
    [Key in keyof T as Key]: Lens;
}

export function createLens(table: string, col: ColumnMap): LensMap<ColumnMap> {
    const r: any = {}
    Object.keys(col).forEach(k => {
        r[k] = new Lens()
    })
    return r
}

interface FormCell {
    type: "cell"
    lens: Lens
    cell: Cell
}
interface FormCandy {
    type: "candy"
}
type FormField = FormCell | FormCandy

class LoadedForm {
    pageCount = 1
    all: FormField[] = []
    current: FormField[] = []

    constructor(field: FormField[] = []) {

    }

    // static async load(ref: SiteDocumentRef, hash: string) {
    //     const form = new LoadedForm(hash)
    //     return form
    // }
}


function createForm(field: FormField[]): LoadedForm {
    const r = new LoadedForm()
    r.all = field
    return r

}



export function fcell(lens: Lens, options: CellOptions): FormCell {
    return {
        type: "cell",
        lens,
        cell: {} as Cell
    }
}
export function fcandy(type: "submit" | "cancel"): FormCandy {
    return {
        type: "candy"
    }
}

// dynamic user edited

// a form is a group of lenses, created from a form template.
export function DynamicForm(props: FormProps) {
    const [error, setError] = createSignal("")
    const nav = useNavigate()
    const page = usePage()
    // active cell
    const pageh = () => parseInt(page.hash)

    const getForm = async (doc: SiteDocumentRef) => {
        throw new Error("not implemented")
    }
    const [form] = createResource(page.doc, getForm)

    return <Switch>
        <Match when={form.loading}>
            <p>Loading</p>
        </Match>
        <Match when={form.error}>
            <p>Error</p>
        </Match>
        <Match when={form()}>
            <Form page={pageh()} form={form()!} />
        </Match>
    </Switch>
}

export interface FormProps {
    page: number
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
                    <InputCell cell={(e as FormCell).cell} />
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