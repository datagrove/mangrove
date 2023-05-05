

// we could opfs or indexeddb?
// should we use swizzling?

interface Page {
    diskloc: number 

}

class Store {
    // can we play games like umbra with overlaps?
    // delete n small pages, to create one big one?
    // depends a lot on the GC how well this works.
   buffer = new SharedArrayBuffer(1024 * 1024 * 1024)
   page = new Array<Page>()

   cool: Page[] = []

   tx = new Map<number, Tx>()
}

class Snapshot {

}


// each Tx needs to hold locks 
class Tx {
    constructor(public store: Store) {

    }
    get(loc: number) {

    }
    put(loc: number, data: Uint8Array) {

    }
}

class Ptree {
    
}


// we need to process operations against a transaction that exists.
// not clear how we should return partial blocks. probably just transfer them as is?
// even with transfer we need to copy the block
// shared array buffer is best plan, lock the page and send the offset.
type Read = {
    from: Uint8Array
    to: Uint8Array
    limit: number
    offset: number
}

type Write = {
    dbptr: string
    data: Uint8Array
}
type BulkWrite = {
    // we need columns for each key value, or probably 
    into: string[]
    key: Uint8Array
    col: Uint8Array[]
}
type UpdateTx =  {
    handle: number, 
    op: "read"| "write"
    data: Read | Write
}

interface PageRef {

}

async function readTx(params: Read) : Promise<PageRef[]> {
    
    return []
}
async function updateTx(params: UpdateTx) {

}
    