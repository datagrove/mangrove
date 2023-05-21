// steps parameterized by 
import { z } from 'zod'
import { JSXElement, Signal, createSignal } from 'solid-js'
import { create, get } from 'sortablejs'
import { Ws } from '../core/socket'
import { Store, createStore } from 'solid-js/store'

export interface SyntaxError {
    message: string
    start: number
    end: number
}
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

// inputcell can access as cell.store[cell.name]
export class Cell<T> {
    constructor(
        public store: Store<T>,
        public CellOptions: CellOptions,

    ) {

    }
}
export type CellMap<T> = {
    [Key in keyof T as Key]: Cell<T>;
}

export interface ViewDesc {
    name: string
    columns: CellOptionMap
    primarykey: string[]
}

// returns a store of cells from a view description
export function createCells(view: ViewDesc) {
    // create a cell for each column in the view.
    const r = createStore<typeof view.columns>({})
    const ox: any = {}
    Object.keys(view.columns).forEach(k => {
        ox[k] = new Cell(r, view.columns[k])
    })
    r[1]((e) => ox)

    // here we could create an effect that would listen to the store and update the db.
    // and subscribe to the db and update the store.

    return r
}
