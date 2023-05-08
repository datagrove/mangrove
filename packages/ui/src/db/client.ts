// steps parameterized by 
import { z } from 'zod'
import { JSXElement, createSignal } from 'solid-js'
// db str needs to be a wrapper around a cellstate, the cell state may be on a remote server, an in-memory cell, or a local cell.
export interface CellOptions {
    name: string,
    label?: string,
    placeholder?: string,
    default?: string,
    validate?: z.ZodString,
    autocomplete?: string
    type?: string
    autofocus?: boolean
    topAction?: () => JSXElement
}

interface SyntaxError {
    message: string
    start: number
    end: number
}

export interface Cell extends CellOptions {
    error_?: SyntaxError[]
    commit(s: string): Promise<void>
    listen(cb: (v: string) => void): void
    value(): string
    setError(s: string): void
    error(): undefined | SyntaxError[]
    clearErrors(): void

}

// is this only for in-memory, or is there a better way to link directly to a database?
// should we be use named parameters here?
export function cell(props: CellOptions): Cell {
    // use array here so we can point to it? is there a cheaper way?
    //let v: string[] = [props?.default ?? ""]
    const [v, setV] = createSignal(props?.default ?? "")
    const [err, setErr] = createSignal<SyntaxError[] | undefined>()
    return {
        ...props,
        validate: props?.validate || z.string(),
        commit: async (ts: string) => {
            console.log("commit", ts)
            setV(ts)
        },
        clearErrors() {
            setErr(undefined)
        },
        error: err,
        setError: (s: string) => {
            setErr([{ message: s, start: 0, end: 0 }])
        },
        listen: (cb: (val: string) => void) => {
            // not called.
        },
        value: () => v()
    }
}

