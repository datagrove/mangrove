import { faker } from "@faker-js/faker"
import { usePage } from "../core"
import { QueryResult, createQuery } from "../db"
import { RichTextEditor, TableView } from "./viewer"
import { BuilderFn, TableContext } from "../editor"

export function EditViewer() {

    // this should be an editor for the particular page in the url
    // we should respect the hash in positioning to a url.
    return <div>Edit Viewer</div>
}

interface FileInfo {
    name: string
    path: string
    type: string
    modified: Date
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
   return <RichTextEditor />
}

type RowMap = Map<number, string>

// this is a list of open files. Should it be just a simple list? how long could it be?
// or should we keep it standard and use fast list?
export function EditTool() {
    const st = usePage()
    //if (!st) throw new Error("no page")
    const R = 100
    const W = 4 // type name modified size
    const items: RowMap[] = []

    const bld: BuilderFn = (ctx: TableContext) => {
        let d = items[ctx.row]
        let ct = d.get(ctx.column.tag)
        ctx.render(<div>{ct}</div>)
    }

    const addRow = (...x: string[]) => {
        const m = new Map<number, string>()
        for (let i = 0; i < x.length; i++) {
            m.set(i, x[i])
        }
        items.push(m)
    }
    for (let i = 0; i < R; i++) {
        addRow("code", faker.string.uuid(), faker.date.recent().toISOString(), "10000")
    }
    init([
        col("Type", 64),
        col("Name", 480),
        col("menu", 64),
    ])
    const q = queryFolder("")
    return <TableView show={q} fallback={<div>Loading</div>} />
}
