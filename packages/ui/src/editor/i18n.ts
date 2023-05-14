import { createSignal } from "solid-js"

export const en = {
    save: "Save",
    cancel: "Cancel",
    insert: "Insert",
}

export const he = {
    save: "להציל",
    cancel: "לְבַטֵל",
    insert: "לְהַכנִיס",
}

interface Ln {
    save: string,
    cancel: string,
    insert: string
}
export const [ln,setLn] = createSignal<Ln>(he)