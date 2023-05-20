import { faker } from '@faker-js/faker'
import { BuilderFn, Column, enableColumnResizing, EstimatorFn, Scroller, ScrollerProps, TableContext } from '../../editor/scroll'
import { createEffect, onCleanup, createSignal, onMount, JSXElement } from 'solid-js'
import { CellOptions } from '../../db/cell'
import { createQuery, QueryResult } from '../../db'
import { usePage } from '../../core/store'


const redFrame = "border-solid border-2 border-red-500"
const greenFrame = "border-solid border-2 border-green-500"
const clearFrame = "border-solid border-0 border-opacity-0"

// we probably need terminal to work
type RowMap = Map<number, string>

// generated? or cache on first use? dx is better with cache/hot load.
// aot faster though. no los dos? decorators?
// maybe generator prepopulates the cache
function queryFolder(path: string): QueryResult {
    const qd = {
        sql: "select type,lens(name),modified,size  from folder where path = ?",
        // this would be generated.
        // cells: [ // can't these all be default from the sql?
        //     { type: "string", name: "type"},
        //     { type: "name", name: "name"},
        //     { type: "date", name: "modified"},
        //     { type: "number", name: "size"},
        // ]
    }
    return createQuery(qd, path)
}

// a query view should have optional header and info boxes?
// header in this case could show breadcrumbs?
export function FolderViewer() {
    const st = usePage()
    //if (!st) throw new Error("no page")

    const q = queryFolder("")
    return <TableView show={q} fallback={<div>Loading</div>} />
}
interface TableViewProps {
    show: QueryResult
    fallback: JSXElement
}
export function TableView(props: TableViewProps) {
    let el: HTMLDivElement
    // we can try to recreate the editor as raw typescript to make it easier to wrap in various frameworks. 
    // const ed = new Editor
    // let edel: HTMLDivElement
    createEffect(() => {
        if (!props.show.loaded) return;
    })

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

        // builder is setting html into a div; works with cells equally well?
        // we are just rendering into a div
        // performance wise is this overkill? we should start with a simple string in many cases 
        // rerender when cell is focused.
        // potentially remeasure row if focused cell becomes larger.
        // potentially build one editor and position it over the row like an inline dialog box?
        const bld: BuilderFn = (ctx: TableContext) => {
            let d = items[ctx.row]
            let ct = d.get(ctx.column.tag)

            ctx.render(<div>{ct}</div>)
            // let [m, o] = ctx.alloc(d.size)
            // for (let i = 0; i < o.length; i++) {
            //     o[i].innerHTML = `<div class=' w-full truncate'>${d.get(i)!}<div>`
            //     o[i].style.width = c.get(i)?.width + 'px'
            //     m.set(i, o[i])
            // }
        }

        const props: ScrollerProps = {
            container: el!,
            row: {
                count: items.length,
            },
            column: {
                header: c,
            },
            builder: bld,
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
