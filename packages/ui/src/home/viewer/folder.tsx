
import { faker } from '@faker-js/faker'
import { BuilderFn, Column, enableColumnResizing, EstimatorFn, Scroller, ScrollerProps, TableContext } from '../../editor/scroll'
import { createEffect, onCleanup, createSignal, onMount } from 'solid-js'

const redFrame = "border-solid border-2 border-red-500"
const greenFrame = "border-solid border-2 border-green-500"
const clearFrame = "border-solid border-0 border-opacity-0"



// we probably need terminal to work
type RowMap = Map<number, string>
export function FolderViewer() {
    let el: HTMLDivElement
    // we can try to recreate the editor as raw typescript to make it easier to wrap in various frameworks. 
    // const ed = new Editor
    // let edel: HTMLDivElement
    let tombstone: HTMLDivElement
    const [debugstr, setDebugstr] = createSignal("woa")

    const R = 100
    const W = 4 // type name modified size
    const items: RowMap[] = []
    const addRow = (...x: string[]) => {
        const m = new Map<number, string>()
        for (let i = 0; i < x.length; i++) {
            m.set(i, x[i])
        }
        items.push(m)
    }

    const c = new Map<number, Column>()
    let cn = 0
    const init = (header: [string, number][]) => {
        cn = header.length
        for (let i = 0; i < header.length; i++) {
            c.set(i, {
                key: i,
                width: header[i][1],
                header: `<div class='p-4'>${header[i][0]}</div>`
            })

        }
    }
    const col = (name: string, width: number) => [name, width] as [string, number]
    init([
        col("Type", 64),
        col("Name", 480),
        col("Modified", 128),
        col("Size", 64),
    ])
    for (let i = 0; i < R; i++) {
        addRow("code", faker.string.uuid(), faker.date.recent().toISOString(), "10000")
    }

    onMount(() => {
        let tombstoneHeight_ = tombstone.offsetHeight
        tombstone.style.display = 'none'

        const est: EstimatorFn = (start: number, end: number) => {
            const r = (end - start) * 24
            return r
        }

        const bld: BuilderFn = (ctx: TableContext) => {
            let d = items[ctx.row]
            let [m, o] = ctx.alloc(d.size)
            for (let i = 0; i < o.length; i++) {
                o[i].innerHTML = `<div class=' w-full truncate'>${d.get(i)!}<div>`
                o[i].style.width = c.get(i)?.width + 'px'
                m.set(i, o[i])
            }
        }

        const props: ScrollerProps = {
            container: el!,
            state: {
                rows: items.length,
                order: [...new Array(cn)].map((e, i) => i),
                columns: c,
            },
            builder: bld,
            height: est,
        }
        const s = new Scroller(props)
        setDebugstr(JSON.stringify(s, null, 2))
        const r = () => {
            // we should be able to adjust grid options here.
            // maybe just use update?
            s.onResize_()

        }
        window.addEventListener('resize', r);
        onCleanup(() => {
            // any value to explicit destruction here?
            window.removeEventListener('resize', r);
        })
    })


    return <>
        <div class={'right-0 top-0 bottom-0 left-80 absolute overflow-auto h-screen' + clearFrame} ref={el!}>
        </div>
        <p ref={tombstone!}>&nbsp;</p>
    </>

}
