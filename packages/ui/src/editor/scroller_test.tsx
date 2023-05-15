
import { faker } from '@faker-js/faker'
import { BuilderFn, EstimatorFn, Scroller, ScrollerProps } from './scroll'
import { createEffect, onCleanup } from 'solid-js'

import { createSignal, JSXElement, onMount } from 'solid-js'
import { render } from 'solid-js/web'
import { Icon } from 'solid-heroicons'
import { xMark, check } from 'solid-heroicons/solid'

import { Editor } from './editor'
import { html2md, md2html } from './md'
import { ln, setLn } from './i18n'

// one kind of 

// global css class?
const redFrame = "border-solid border-2 border-red-500"
const greenFrame = "border-solid border-2 border-green-500"
const clearFrame = "border-solid border-0 border-opacity-0"

// note the potential danger but need of using html messages here! whitelist is going to be painful. Even markdown doesn't save us because of mdx.
export interface FakeEntry {
    message: string
    avatar: string
}


export function FakeScroll() {
    let el: HTMLDivElement
    // we can try to recreate the editor as raw typescript to make it easier to wrap in various frameworks. 
    const ed = new Editor
    let edel: HTMLDivElement
    let tombstone: HTMLDivElement
    const [debugstr, setDebugstr] = createSignal("woa")

    const items = [...new Array(100)].map((e, i) => {
        return [...new Array(10)].map((v, j) => i + "," + j + ". " + faker.lorem.word())
    })

    onMount(() => {
        ed.mount(edel)
        ed.text = "בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃"

        let tombstoneHeight_ = tombstone.offsetHeight
        tombstone.style.display = 'none'

        const est: EstimatorFn = (start: number, end: number) => {
            const r = (end - start) * 24
            console.log("est", start, end, tombstoneHeight_, r)
            return r
        }

        const bld: BuilderFn = (old: HTMLElement, row: number, column: number) => {
            let d = items[row]
            old.innerHTML = `<p class='p-4'>${d[column]}<p>`
        }
        const props: ScrollerProps = {
            container: el!,
            rows: items.length,
            columns: {
                width: 1,
            },
            builder: bld,
            estimateHeight: est,
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
        <pre class=' fixed top-0 left-0 overflow-auto w-64 h-screen z-50 bg-black'>
            {debugstr()}
        </pre>
        <div class={'right-0 top-0 bottom-32 left-80 absolute overflow-y-auto overflow-x-hidden h-screen' + clearFrame} ref={el!}>

        </div>
        <div class='right-0 bottom-0 left-80 absolute overflow-y-auto overflow-x-hidden h-32  ' >
            <div class='h-full w-full max-w-none prose dark:prose-invert' ref={edel!} />
        </div>

        <p ref={tombstone!}>&nbsp;</p>

    </>

}



