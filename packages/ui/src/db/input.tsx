import { Component, createEffect, createSignal, onCleanup } from "solid-js"
import { createEditor, dbstr as cellptr, makeCell } from "./client"
import { z } from "zod"
import { BlueButton } from "../lib/form"


export const Input: Component<{ ptr: cellptr, label: string }> = (props) => {
    const [error, setError] = createSignal<string>("")
    const [edref] = createEditor(props.ptr, setError)
    return <div>
        <div>{props.label}</div>
        <div class='m-2 text-black' ><input ref={edref} />
            <div> {error()}</div></div>
    </div>
}


export const Sampleform: Component = (props) => {
    const af = {
        first: makeCell("", z.string().min(3)),
        last: makeCell("", z.string().min(3)),
    }
    const submit = (e: Event) => {
        e.preventDefault()
    }
    return <form onsubmit={submit}>
        <Input label='one' ptr={af.first} />
        <Input label='two' ptr={af.last} />
        <BlueButton onClick={() => {
            for (const [k, v] of Object.entries(af)) {
                console.log(k, v.value())
            }
        }}>Submit</BlueButton>
    </form>
}