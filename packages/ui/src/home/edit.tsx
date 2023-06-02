import { faker } from "@faker-js/faker"
import { getDocument, timeAgo, usePage } from "../core"
import { QueryResult, createQuery } from "../db"
import { RichTextEditor, TableView } from "./viewer"
import { BuilderFn, Scroller, ScrollerProps, TableContext } from "../editor"
import { Show, createEffect, createResource, createSignal } from "solid-js"
import { xMark, arrowsRightLeft, document, arrowUp } from 'solid-heroicons/solid'
import { Icon } from 'solid-heroicons'
import { createStore } from "solid-js/store"
import Sortable from "solid-sortablejs"
import { JSX } from "solid-js";
import { Bb } from "../layout/nav"
import { set } from "zod"
import { useNavigate } from "@solidjs/router"
import { BlueButton } from "../lib/form"


export function EditViewer() {
    const page = usePage()
    const doc = createResource(page.path, getDocument)

    // this should be an editor for the particular page in the url
    // we should respect the hash in positioning to a url.
    return <>
        <RichTextEditor/>
    </>
}


interface FileInfo {
    name: string
    path: string
    type: string
    modified: string
    size: number
}


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
    return <div>

    </div>
}


const fake = () => {
    const f: FileInfo[] = []
    for (let i = 0; i < 100; i++) {
        f.push({
            name: faker.system.fileName(),
            path: faker.system.filePath(),
            type: "code",
            modified: faker.date.recent({ days: 7 }).toISOString(),
            size: 100
        })
    }
    return f
}
export const [items, setItems] = createStore<FileInfo[]>(fake())



// this is a list of open files. Should it be just a simple list? how long could it be?
// or should we keep it standard and use fast list?
export function EditTool() {
    const nav = useNavigate()
    const itemStyles: JSX.CSSProperties = { "user-select": "none", background: "green", padding: "10px", "min-width": "100px", margin: "5px", "border-radius": "4px", color: "white" };

    const FileEntry = (props: { file: FileInfo }) => {
        const tm = new Date(props.file.modified)
        const diff = (Date.now() - tm.getTime()) / 1000
        const dt = timeAgo(props.file.modified)

        const sync = () => {
            nav('/en/site/' + props.file.path)
        }
        const close = () => {
            setItems(items.filter(x => x.path != props.file.path))
        }

        return <div class='w-full cursor-pointer flex py-2 bg-tool flex-row items-center space-x-2'>
            <div class='w-6 h-6'>
                <Bb class='block w-6 h-6 overflow-hidden' onClick={close} ><Icon path={xMark} /></Bb></div>
            <div class='w-6 h-6'><Icon path={document} class='block w-6 h-6' /></div>
            <div class='flex-grow overflow-hidden text-ellipsis' onClick={sync}>

                <div class='text-ellipsis h-6 overflow-hidden'>{props.file.name}</div>
                <div class='flex-grow font-sm text-neutral-500 truncate h-6 '>{dt} {props.file.path}</div>
            </div>
        </div>
    }
    const closeall = () => {
    }
    // use a header with a button
    return (
        <div class='flex flex-col w-full h-full'>
            <div><BlueButton onClick={()=>closeall()}>CloseAll</BlueButton></div>
            <div class='flex-grow overflow-auto'>
        <Sortable idField="path" items={items} setItems={setItems} >
            {item => <FileEntry file={item} />}
        </Sortable>
        </div>
        </div>
    );
    // let el: HTMLDivElement | null = null
    // createEffect(() => {
    //     let opts: ScrollerProps = {
    //         container: el!,
    //         row: {
    //             count: f.length,
    //         },
    //         builder: function (ctx: TableContext): void {
    //             const o: FileInfo = f[ctx.row]
    //             ctx.render(<FileEntry file={o} />)
    //         }
    //     }
    //     let ed = new Scroller(opts)
    // })

    // return <div class='absolute top-0 left-0 right-0 bottom-0 overflow-auto' ref={el!} />
}
// export function EditTool() {
//     const st = usePage()
//     //if (!st) throw new Error("no page")
//     const R = 100
//     const W = 4 // type name modified size
//     const items: RowMap<string>[] = []

//     const bld: BuilderFn = (ctx: TableContext) => {
//         let d = items[ctx.row]
//         let ct = d.get(ctx.column.tag)
//         ctx.render(<div>{ct}</div>)
//     }
// maps from opaque column tag to a value.
//type RowMap<T> = Map<number, T>
//     const addRow = (...x: string[]) => {
//         const m = new Map<number, string>()
//         for (let i = 0; i < x.length; i++) {
//             m.set(i, x[i])
//         }
//         items.push(m)
//     }
//     for (let i = 0; i < R; i++) {
//         addRow("code", faker.string.uuid(), faker.date.recent().toISOString(), "10000")
//     }
//     init([
//         col("Type", 64),
//         col("Name", 480),
//         col("menu", 64),
//     ])
//     const q = queryFolder("")
//     return <TableView show={q} fallback={<div>Loading</div>} />
// }
