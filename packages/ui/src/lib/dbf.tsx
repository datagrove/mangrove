import { Accessor, Setter, createSignal, onCleanup } from "solid-js"
import { UpdateRow, Watchable, Ws, getWs, profile } from "../db/socket"

const fc = new Map<string, Folder>()
type FolderWatcher = (f: Folder) => void
export const myfile = (s: string) => `file://${profile.server}/${profile.username}/~/${s}`

export class Folder {
    constructor(public key: string, public ws: Ws) { }
    loading = true
    error = ""
    handle = 0
    entries: File[] = []
    watchers = new Set<FolderWatcher>()
}
export function entries(f: Folder) {
    return f.entries
}

// path is rooted on the user account that's tracked by the host
// we can have a folder that links to other servers
export function dropWatcher(f: Folder, watcher: FolderWatcher) {
    f.watchers.delete(watcher)
    if (f.watchers.size == 0) {
        fc.delete(f.key)
        f.ws.rpc<any>('release', f.key)
    }
}

// default should be date descending (newest first)
export interface WatchOptions {
    sort: string|undefined
    asc: boolean|undefined
    filter: undefined|((f: File) => boolean)
}

export function createWatch(url: string, options?: WatchOptions) : [Accessor<Folder>, Setter<WatchOptions>] {
    let f = fc.get(url)
    if (!f) {
        f = new Folder(url, getWs(url))
        fc.set(url, f)
    }
    const upd = (e: UpdateRow<File>[]) =>{

    }

    const r = createSignal(f)
    const [opt,setOpt] = createSignal(options??{sort: 'modified', asc: false})
    const [gr, setR] = r
    if (f.watchers.size == 0) {
        f.ws.subscribe<Watchable,File>('watch', upd,  url).then((h) => {
            f!.handle = h.handle
            f!.loading = false
        }).catch((e: any) => {
            f!.error = e.toString()
            f!.loading = false
        })
    }
    f.watchers.add(setR)

    onCleanup(() => dropWatcher(f!, setR))
    return [gr, setOpt]
}

/*
export function createSearch(url: string, query: string) {
    const f = new Folder(url, getWs(url))
    const r = createSignal(f)
    const [_, setR] = r
    f.ws.search<any>('search', url, query).then((h) => {
        f.handle = h.handle
        f.loading = false
    }).catch((e: any) => {
        f.error = e.toString()
        f.loading = false
    })
    onCleanup(() => dropWatcher(f, setR))
    return r
}
*/