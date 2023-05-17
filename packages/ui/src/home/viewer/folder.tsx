
import { faker } from '@faker-js/faker'
import { BuilderFn, Column, enableColumnResizing, EstimatorFn, Scroller, ScrollerProps, TableContext } from '../../editor/scroll'
import { createEffect, onCleanup, createSignal, onMount } from 'solid-js'

const redFrame = "border-solid border-2 border-red-500"
const greenFrame = "border-solid border-2 border-green-500"
const clearFrame = "border-solid border-0 border-opacity-0"
function DebugWindow(props: { debugstr: string }) {
    return <pre class=' fixed top-0 left-0 overflow-auto w-64 h-screen z-50 bg-black'>
        {props.debugstr}
    </pre>
}

// make draggable headers
function FakeScroll2() {
    let el: HTMLTableElement
    const [debugstr, setDebugstr] = createSignal("woa")
    createEffect(() => {
        // enableColumnDragging(el)
        enableColumnResizing(el, setDebugstr)
    })

    return <><DebugWindow debugstr={debugstr()} />
        <table ref={el!} id="myTable" class='border-collapse '>
            <thead>
                <tr>
                    <th class='w-48'>Column 1</th>
                    <th class='w-48'>Column 2</th>
                    <th class='w-48'>Column 3</th>
                </tr></thead>
            <tbody>
                <tr>
                    <td>Value 1-1</td>
                    <td>Value 1-2</td>
                    <td>Value 1-3</td>
                </tr>
                <tr>
                    <td>Value 2-1</td>
                    <td>Value 2-2</td>
                    <td>Value 2-3</td>
                </tr>
            </tbody>
        </table></>
}

//export function FakeEditor() {
//     const ed = new RichTextEditor
//     let edel: HTMLDivElement
//     onMount(() => {
//         ed.mount(edel)
//         ed.text = "בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃"
//     })
//     return <div class='h-full w-full max-w-none prose dark:prose-invert' ref={edel!} />
// }


// export function FakeChat() {
//     return <div class='h-full w-full max-w-none prose dark:prose-invert'>
//     </div>
// }



// tables need a header
// all pages need an info box.
// we need a growing chat box with a bubble menu
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
