
// user settings should be a store? does the context deliver a store then?
// is a database something related but different than a store?

// some of these things we might replace with C++



// there is only one database, so that's global constant
// it acts like a store (is it a store?), views are reactive
// views should be an array of cells, so that edits are 2 way

import { Accessor, createSignal } from "solid-js"
import { CellOptions } from "./cell"
import Shared from './shared?sharedworker'
import { SendToWorker } from './useworker'
export class Db {
    public constructor(public w: SendToWorker) {
    }
}



export async function createDatabase(): Promise<Db> {
    let s = await SendToWorker.shared(new Shared)
    return new Db(s)
}


// makeCell(cellTemplate)
// we could have a query return cellTempate[]? more like it takes that as argument

// queries return lenses? select lens(name) 
export interface Query {
    sql: string
    cells?: CellOptions[]
}

// how do we support suspense?
// can we support schema changes such as adding a column?

// the estimated size of the query is reactive and it can stream diffs as the data is updated.
// use something like a for component memoize ?
export interface QueryResult {
    error: string
    loaded: boolean
    query: Query
    estimatedSize: Accessor<number>
}

// seems like overkill, using scroller anyway, scroller can manage
// type ForFn = (result: QueryResult) => JSX.Element
// export function QueryFor(props: { each: QueryResult, children: ForFn}): JSX.Element {
//     return <div>QueryFor</div>
// }

// derive queries
// close: () => { },
// filter: (pattern: string) => { },
// rows: (start: number, end: number) => { return [] },

export function closeQuery(query: QueryResult) {

}

export function createQuery(desc: Query, ...params: any[]): QueryResult {
    const [size, setSize] = createSignal(0)
    return {
        error: "",
        loaded: true,
        query: desc,
        estimatedSize: size
    }

}