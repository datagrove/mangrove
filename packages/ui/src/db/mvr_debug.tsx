import { For, Show, createEffect, createSignal } from "solid-js"
import { useDg, useSyncPath } from "./mvr_tabstate"
import { DocState } from "./mvr_worker"
import { set } from "zod"




export function DbDebugger(props: { path?: string }) {
    // {prov?._debug[0]()}
    const dg = useDg()
    const [ps, setPs] = createSignal(dg?.ps)
    const [ds, setDs] = createSignal<DocState|undefined>()
    const [doc,setDoc] = createSignal<string>("")
    const [docs,setDocs] = createSignal<string[]>([])
    const [ver,setVer] = createSignal<number>(0)
    const [dver,setDver] = createSignal<number>(0)

    const refresh = () => {
        setPs(dg?.ps)
        setDs(dg?.ps?.ds?.get(doc())) 
        setDocs([...ps()?.ds.keys()??[]])
        if (!doc()) setDoc(docs()[0])
        setVer(ps()?.changed[0]()??0)
        setDver(ds()?.changed[0]()??0)

        //console.log("SERVER CHANGe ", ps(),docs(),doc(),ds())        
    }

    createEffect(() => {    
        refresh()
    })   

    const pick =   (  e: Event) =>  setDoc( (e.target as HTMLSelectElement).value)
    
    const show = () => {
        return dver()+JSON.stringify(ds()?.toJson(),null,2)
    }

    return <Show when={ps()}>
        <div class='w-full'>
        <div class='flex'><div>{ps()!.changed[0]()},{ds()?.changed[0]()}</div>
        <select class='text-black' onChange={pick} value={doc()}>
            <For each={docs()}>
                {(d) => <option>{d}</option>}</For>
        </select>
        <button onClick={refresh}>Refresh</button>
        </div>
        {show()}
    </div></Show>
}

