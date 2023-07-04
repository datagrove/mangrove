


// a public web site is materialized view that was published together with user owned database comparable to localStorage
export function toUtf8(s: string) {
    return new TextEncoder().encode(s);
}

export function fromUtf8(s: Uint8Array) {
    return new TextDecoder().decode(s);
}

type Listener = ()=>void

export class ChangeNotifier{
    listener = new Set<Listener>()

    addListener(l: Listener){
        this.listener.add(l)
    }
    removeListener(l: Listener){

    }
    notifyListeners(){
        for (let o of this.listener){
            o()
        }
    }
}

export class SnapshotUpdate<T> {

}

export class  Snapshot<T> extends ChangeNotifier {
    // version: number 
    // note that the snapshot update is only valid during a call to 
    lastUpdate = new SnapshotUpdate<T>()

    constructor(
        public dx: Dx | undefined,
        public length: number,
        // returns null as placeholder, means "don't know yet." will notify when available.
        public get: (i: number) => T|null){
            super()
    }
    removeListener(l: Listener ){
        super.removeListener(l)
        if (!this.listener.size ){
            this.dx?.watcher.delete(this)
        }
    }

    update(d: DxUpdate){
        let changed = true
        if (changed) {
             this.notifyListeners()
        }
    }

    static fromArray<T>(data: T[]){
        return new Snapshot<T>(
            undefined,
            data.length,
            (n: number) => data[n]
        )
    }
}


// we care about two ordered streams.
export class Dx {
    // we should use an interval tree of watchers.
    watcher = new Set<Snapshot<any>>()

    update(d: DxUpdate) {
        for (let o of this.watcher) {
            o.update(d)
        }
    }
    onmessage(m: Uint8Array) {
    }
}
const _dx = new Dx()
const useDx = ()=>_dx

// scrollers can work by blocks, blocks have strings that are short or hash split.
// formatted numbers are sortable too?
// spreadsheet grids are more logs?


// appends are just inserts into the blob table
export interface DxUpdate {
    time: number[][]
    data: Uint8Array[]
    count: number[]
}