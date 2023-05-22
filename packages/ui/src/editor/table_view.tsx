import { faker } from '@faker-js/faker'
import { BuilderFn, Column, enableColumnResizing, EstimatorFn, Scroller, ScrollerProps, TableContext } from './scroll'
import { createEffect, onCleanup, createSignal, onMount, JSXElement } from 'solid-js'
import { CellOptions } from '../db/cell'
import { createQuery, QueryResult } from '../db'
import { usePage } from '../core/store'


const redFrame = "border-solid border-2 border-red-500"
const greenFrame = "border-solid border-2 border-green-500"
const clearFrame = "border-solid border-0 border-opacity-0"

// we probably need terminal to work



// interesting challenge - cells can be formatted into many ways, not just column per cell. name = editable, modified not editable. we need to have table render cells in a way that they contain multiple cells.

// width and height should come from query result?


export function QueryView(props: { query: QueryResult, builder: BuilderFn }) {
    return <TableView  fallback={<div>loading</div>} builder={props.builder} width={100} height={100} />
}

interface TableViewProps {
    fallback: JSXElement
    builder: BuilderFn
    header?: BuilderFn
    width: number
    height: number
}
// this formats the table, but you still have to provide the data through a callback
// the callback can render anything it wants
export function TableView(props: TableViewProps) {
    let el: HTMLDivElement
    let tombstone: HTMLDivElement
    const [debugstr, setDebugstr] = createSignal("woa")
    const col = (name: string, width: number) => [name, width] as [string, number]

    // we can try to recreate the editor as raw typescript to make it easier to wrap in various frameworks. 
    // const ed = new Editor
    // let edel: HTMLDivElement

    const c: Column[] = []
    let cn = 0
    const init = (header: [string, number][]) => {
        cn = header.length
        for (let i = 0; i < header.length; i++) {
            c.push({
                tag: i,
                width: header[i][1],
                html: `<div class='p-4'>${header[i][0]}</div>`
            })

        }
    }

    onMount(() => {
        let tombstoneHeight_ = tombstone.offsetHeight
        tombstone.style.display = 'none'

        const est: EstimatorFn = (start: number, end: number) => {
            const r = (end - start) * 24
            return r
        }

        // builder is setting html into a div; works with cells equally well?
        // we are just rendering into a div
        // performance wise is this overkill? we should start with a simple string in many cases 
        // rerender when cell is focused.
        // potentially remeasure row if focused cell becomes larger.
        // potentially build one editor and position it over the row like an inline dialog box?

        const props: ScrollerProps = {
            container: el!,
            row: {
                count: items.length,
            },
            column: {
                header: c,
            },
            builder: props.builder,
            height: est,
            // mouseover, mousedown, etc.
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
        <div style={{
            left: "0px",
            right: "0px",
            top: "0px",
            bottom: "0px",
        }} class={'absolute overflow-auto h-screen' + clearFrame} ref={el!} />
        <p ref={tombstone!}>&nbsp;</p>
    </>

}
