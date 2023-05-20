// steps parameterized by 
import { z } from 'zod'
import { JSXElement, Signal, createSignal } from 'solid-js'
import { get } from 'sortablejs'

// db str needs to be a wrapper around a cellstate, the cell state may be on a remote server, an in-memory cell, or a local cell.
export interface CellOptions {
    name?: string,
    label?: string,
    placeholder?: string,
    default?: string,
    validate?: z.ZodString,
    autocomplete?: string
    type?: string
    autofocus?: boolean
    topAction?: () => JSXElement
}
export interface CellOptionMap {
    [key: string]: CellOptions
}


export type CellMap<T> = {
    [Key in keyof T as Key]: Cell<T>;
}

interface SyntaxError {
    message: string
    start: number
    end: number
}

// just a store + resource?
// can sqlc use json serialization?
interface ReaderWriter {
    update(key: string, value: string) : void
    listen(key: string, cb: (v: string) => void):void
    refresh(): void
}

// when this updates, it needs to signal all its cells
// or it could be more clever and diff against the previous values.
export class DbReaderWriter implements ReaderWriter {
    constructor(public table: string, public primarykey: any) {

    }
    update(key: string, value: string) {
    }
    listen(key: string, cb: (v: string) => void) {
    }
    refresh(){
    }
}

export function createCells<T extends CellOptionMap>(rmw: ReaderWriter,  col: T): CellMap<T> {
    const r: any = {}
    Object.keys(col).forEach(k => {
        var o  = new Cell(k, rmw, col[k])
        r[k] = o
    })
    return r
}

interface TableDesc {
    name: string
    columns: CellOptionMap
    primarykey: string
}
export function createUpdater(table: TableDesc) {
    return createCells(new DbReaderWriter(table.name, table.primarykey), table.columns)
}

// can this just implement signal? how is a lens any different?
// export interface Lens<T = any> {
//     addListener(fn: (v: T) => void) : void
//     set(v: T) : void 
// }




// a Cell is a [celloption, lens] with error tracking.
// you can't send it to workers, you need to rebuild on the other side
// but mostly a cell will only live in the main thread.

// maybe should be enum?
enum CellState {
    loading,
    error,
    available,
}

// maybe this should be a function returning a getter and a setter?
// its more like a resource, since it has a loading state
// solid uses () for get value. it returns the mutator from createResource
// potentially we could implement refresh as well, since most databases don't support streaming
// maybe cells could know they are part of a tuple and store that RMW style.


export class Cell<T>  {
    signal: Signal<T|undefined>
    state: Signal<CellState>
    error_: SyntaxError[] = []
    constructor(
        public name: string,
        public rmw: ReaderWriter,
        public options: CellOptions,
    ){
        
        this.signal  = createSignal<T|undefined>()
        this.state = createSignal<CellState>(CellState.loading)     
    }

    setValue(t: T){
        this.rmw.update(this.name, t as any)
    }

    operator() {
        return this.signal[0]()
    }
}



    

    // async set(ts: string) : void{
    //     console.log("commit", ts)
    //     setV(ts)
    // }
    // clearErrors() {
    //     setErr(undefined)
    // }

    // setError: (s: string) => {
    //     setErr([{ message: s, start: 0, end: 0 }])
    // },
    // listen: (cb: (val: string) => void) => {
    //     // not called.
    // },
    // value: () => v()
    


    // setValue(s: string): Promise<void>
    // listen(cb: (v: string) => void): void
    // value(): string
    // setError(s: string): void
    // error(): undefined | SyntaxError[]
    // clearErrors(): void

    // use array here so we can point to it? is there a cheaper way?
    //let v: string[] = [props?.default ?? ""]

