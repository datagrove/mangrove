import { createSignal } from "solid-js"


const en  = {
    jobview: "Job View"
}


type L = Partial<typeof en>

export const [l,setL] = createSignal<L>(en)