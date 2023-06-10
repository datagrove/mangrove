
// a rope + interval tree that allows inserted formats.
// the invalidate, don't transform is most interesting with regard to deletions, but i think its ok. you bold, i delete, my delete is invalid because it didn't see your edits. I could also split into pieces though.


import { createContext, createEffect, createSignal, useContext } from "solid-js"
import { Channel, Service, WorkerChannel, apiSet } from "../abc/rpc"
import { JsonPatch } from "../lexical/sync"
import { ListenerApi } from "./data"
import { useTab } from "./tab"
import { Doc } from "./doc_worker"


// can buffer be completely in a worker an do the rest here?
export function createBuffer(key: (string | (() => string))) {
    const tab = useTab()!
    const [version, setVersion] = createSignal(0)

    let st = {
        key: "",
    }
    const setKey = (key: string)=> {
        if (st.key) {
            tab.disconnect(st.key, setVersion)
        }
        st.key = key
    }
    const b = new Doc()

    if (typeof key == "function") {
        const keyf = key as () => string
        createEffect(() => {
            setKey(keyf())
        })
        key = key()
    } else {
        setKey(key)
    }

    return [b.update.bind(b), version]
}




