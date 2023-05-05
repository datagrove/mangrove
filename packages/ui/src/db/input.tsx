import { Component, createEffect, createSignal, onCleanup } from "solid-js"
import { createEditor, dbstr } from "./client"
import { z } from "zod"


// create a enditor
// creating type

/*
export function createCell<T,K,C=Committer>(db: Dbms, 
    table: DbTable<T,K>, 
    attr: (keyof T), key: K ) {

    const s = ""
    const r : CellState =  {
        value: s,
        predicted: s,
        proposals: [],
        gsn: 0,
        lsn: 0,
        committer: {}
    }
    return r
}
*/

export const Inputx: Component<{ ptr: dbstr , validate: z.ZodString}> = (props) => {
    const [edref, ed] = createEditor(props.ptr)

    const [error,setError] = createSignal<string>("")

    // when the editor changes we want to revalidate
    // we can do this with normal input onchange though
    const v1 = (v: any) => { 
        const result = props.validate.safeParse(v.target?.value)
        if (result.success) {
            setError("")
        } else {
            setError(result.error.message)
        }
     }
    return <div><input ref={edref} onInput={ v1}/>
        <div> validate message</div>
    </div>
}