import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";

// one one level deep.
export interface Vtab {
    open?: boolean
    color?: string
    label?: string
    icon?: string
    count?: number
    // groups always
    children: Vtab[]
}

// we need to load this on startup
export class VtabStore {
    root?: Vtab
    selected = 0
}

export const [vtabPin, setVtabPin] = createSignal(false)
export const [menuOpen, setMenuOpen] = createSignal(true)

//export const [vtabOpen, setOpen] = createSignal(true)
export const [vtabs, setVtabs] = createStore<VtabStore>(new VtabStore);

