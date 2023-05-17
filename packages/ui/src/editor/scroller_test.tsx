
import { faker } from '@faker-js/faker'
import { BuilderFn, Column, enableColumnResizing, EstimatorFn, Scroller, ScrollerProps, TableContext, TableRow } from './scroll'
import { createEffect, onCleanup } from 'solid-js'

import { createSignal, JSXElement, onMount } from 'solid-js'
import { render } from 'solid-js/web'
import { Icon } from 'solid-heroicons'
import { xMark, check } from 'solid-heroicons/solid'

import { Editor } from './editor'
import { html2md, md2html } from './md'
import { ln, setLn } from './i18n'


import './editor.css'
import { TestDrag } from './selectionbox'
import { SiteMenuContent } from '../layout/site_menu'
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

export function FakeEditor() {
    const ed = new Editor
    let edel: HTMLDivElement
    onMount(()=>{
        ed.mount(edel)
        ed.text = "בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃"
    })
    return <div class='h-full w-full max-w-none prose dark:prose-invert' ref={edel!} />
}

// one cell width
// potentially multiple columns if the screen is wide enough
// if clicking a thread in column x, default to opening in column x+1?
// probably use vscode way of explicit splitting
export function FakeChat() {
    return <div class='h-full w-full max-w-none prose dark:prose-invert'>
        </div>
}



// tables need a header
// all pages need an info box.
// we need a growing chat box with a bubble menu
// we probably need terminal to work
export function FakeSheet() {
    let el: HTMLDivElement
    // we can try to recreate the editor as raw typescript to make it easier to wrap in various frameworks. 
    const ed = new Editor
    let edel: HTMLDivElement
    let tombstone: HTMLDivElement
    const [debugstr, setDebugstr] = createSignal("woa")

    const N = 100
    const R = 100
    const W = 100
    const items = [...new Array(R)].map((e, i) => {
        const m = new Map<number, string>()
        for (let j = 0; j < N; j++) {
            m.set(j, i + "," + j + ". " + faker.lorem.word())
        }
        return m
    })
    const c = new Map<number, Column>()
    for (let i = 0; i < N; i++) {
        c.set(i, { key: i, width: W, header: "<div class='p-4'>col" + i + "</div>" })
    }
    //console.log("items", items)

    onMount(() => {
        ed.mount(edel)
        ed.text = "בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃"

        let tombstoneHeight_ = tombstone.offsetHeight
        tombstone.style.display = 'none'

        const est: EstimatorFn = (start: number, end: number) => {
            const r = (end - start) * 24
            //console.log("est", start, end, tombstoneHeight_, r)
            return r
        }

        const bld: BuilderFn = (ctx: TableContext) => {
            let d = items[ctx.row]
            let [m, o] = ctx.alloc(d.size)
            for (let i = 0; i < o.length; i++) {
                o[i].innerHTML = `<p class='p-4'>${d.get(i)!}<p>`
                o[i].style.width = W + 'px'
                m.set(i, o[i])
            }
            //console.log("build", d, o,m)
        }



        const props: ScrollerProps = {
            container: el!,
            state: {
                rows: items.length,
                order: [...new Array(N)].map((e, i) => i),
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
        <TestDrag />
        <div class={'right-0 top-0 bottom-32 left-80 absolute overflow-auto h-screen' + clearFrame} ref={el!}>

        </div>
        <div class='right-0 bottom-0 left-80 absolute overflow-y-auto overflow-x-hidden h-32  ' >
            <div class='h-full w-full max-w-none prose dark:prose-invert' ref={edel!} />
        </div>
        <p ref={tombstone!}>&nbsp;</p>
    </>

}



