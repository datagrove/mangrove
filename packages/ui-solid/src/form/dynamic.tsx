import { useNavigate } from "@solidjs/router"
import { createSignal, createResource, Switch, Match } from "solid-js"
import { usePage, SiteDocumentRef } from "../core"
import { Form, FormProps } from "./form"


export interface Document {
    created: Date
    updated: Date
    finished: Date
    deprecated: Date
}
interface Form {

}
// the filled form has a status that can show if it has to be made immutable. (might be irrelevant)
export interface FilledForm extends Document {
    form: Form  // immutable
    values: {
        [key: string]: any
    }
}

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
