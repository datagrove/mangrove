
import { faker } from '@faker-js/faker'
import { BuilderFn, Column, enableColumnResizing, EstimatorFn, Scroller, ScrollerProps, TableContext } from '../../editor/scroll'
import { createEffect, onCleanup } from 'solid-js'

import { createSignal, onMount } from 'solid-js'


import { TestDrag } from '../../editor/selectionbox'
import { RichTextEditor } from '../../lexical'

// one kind of 

// global css class?
const redFrame = "border-solid border-2 border-red-500"
const greenFrame = "border-solid border-2 border-green-500"
const clearFrame = "border-solid border-0 border-opacity-0"
function DebugWindow(props: { debugstr: string }) {
    return <pre class=' fixed top-0 left-0 overflow-auto w-64 h-screen z-50 bg-black'>
        {props.debugstr}
    </pre>
}

// make draggable headers
export function FakeScroll2() {
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
export function SheetViewer() {
    let el: HTMLDivElement
    // we can try to recreate the editor as raw typescript to make it easier to wrap in various frameworks. 
    // const ed = new Editor
    // let edel: HTMLDivElement
    let tombstone: HTMLDivElement
    const [debugstr, setDebugstr] = createSignal("woa")
    const N = 100

    const c : Column[] = []
    for (let i = 0; i < N; i++) {
        c.push({ tag: i, width: 96, html: "<div class='p-4'>col" + i + "</div>" })
    }


    onMount(() => {
        let tombstoneHeight_ = tombstone.offsetHeight
        tombstone.style.display = 'none'

        const est: EstimatorFn = (start: number, end: number) => {
            const r = (end - start) * 24
            //console.log("est", start, end, tombstoneHeight_, r)
            return r
        }

        const bld: BuilderFn = (ctx: TableContext) => {
            const f = <p class='p-4'>{ctx.row},{ctx.column.tag}</p>
            ctx.render(f)
        }

        const props: ScrollerProps = {
            container: el!,
            row: {
                count: N
            },
            column: {
                header: c,
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
        <TestDrag />
        <div class={'right-0  top-0 bottom-32 left-0 absolute overflow-auto h-screen' + clearFrame} ref={el!}>

        </div>
        <div class='right-0 left-0 bottom-0 absolute overflow-y-auto overflow-x-hidden h-32  ' >
            <div class='h-full bg-neutral-800 w-full max-w-none prose dark:prose-invert'  >
                <RichTextEditor />
            </div>
        </div>
        <p ref={tombstone!}>&nbsp;</p>
    </>

}





