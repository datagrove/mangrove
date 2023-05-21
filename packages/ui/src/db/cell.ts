// steps parameterized by 
import { z } from 'zod'
import { JSXElement, Signal, createEffect, createSignal } from 'solid-js'
import { create, get } from 'sortablejs'
import { Ws } from '../core/socket'
import { SetStoreFunction, Store, createStore, unwrap } from 'solid-js/store'

type StorePair<T> = [get: Store<T>, set: SetStoreFunction<T>]
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
// a cell is a [store<{string:string}>, celloptions, rmw]
// can I just return the string store and call it a day?
// return an object (not a store) because the set of cells is not reactive
// each cell needs to point to the store of strings, and the rmw.
// inputcell can do the rest.

type StringMap = { [key: string]: string }
export class Cell {
    constructor(
        public store: StorePair<StringMap>,
        public opt: CellOptions,
        public rmw: () => void
    ) {

    }
    clearErrors() {
    }
    setValue(v: string) {
        this.store[1]((s) => {
            s[this.opt.name!] = v
            return s
        })
        this.rmw()
    }
    value(): string {
        // my store has cells in it, not values directly?
        // maybe I should make the store hold the values and not the cells.
        // then I would access as
        const r = this.store[0][this.opt.name!]
        return r
    }
}
export type CellMap<T> = {
    [Key in keyof T as Key]: Cell;
}

export interface ViewDesc {
    name: string
    cells: CellOptionMap
    primary: string[]
}

// we need build cells for the errors, 
// instead manage the errors in inputcell
// returns a store of cells from a view description

export class CellSet<T> {
    //T is an interface that has a string for each cell
    // C is a interface that has a cell for each cell
    constructor(
        public store: Store<T>,
        public cell: CellMap<T>
    ) {
    }
}

export function createCells(view: ViewDesc) {
    // create a cell for each column in the view.
    // create a store for the strings that hold the values of the cells.
    const o = createStore<StringMap>({})
    //const r = createStore<typeof view.cells>({})
    const ox: any = {}
    const ov: any = {}
    const rmw = () => {
        console.log(ov, unwrap(o[0]), "cellset")
    }
    Object.keys(view.cells).forEach(k => {
        ox[k] = new Cell(o, view.cells[k],rmw)
        ov[k] = view.cells[k].default || ""
    })
    o[1]((e) => ov)



    // here we could create an effect that would listen to the store and update the db.
    // and subscribe to the db and update the store.


    return ox
}
