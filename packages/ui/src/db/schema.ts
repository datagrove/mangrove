

// the schema needs to be in the worker and in the tab
// the name here must be unique and 
export interface QuerySchema<Key> {
    name: string
    marshalKey(key: Key) : string 
    //marshalRead(key: Query) : string
    marshalRead1(key: Key) : any[]
    marshalWrite1(key: Key) : any[]

    // functors are nameable operations that can be applied to a tuple and an update
    // mostly one x = y of update table. 

}

export const encodeNumber = (n: number) => n.toString(16).padStart(15, '0')

type FunctorMap =  {
    [name: string]: (tuple: any, update: any) => any
}
export interface Schema {
    create: string[],
    view: {
        [name: string]: QuerySchema<any>
    },

    functor: FunctorMap

}

// we probably need a context; we might need the primary key that we can write to?
// 1. Write a new file (opfs), 2. write tuple referencing the new snapshot, 3. delete the old snapshot.
export const standardFunctors : FunctorMap = {
    "set": (tuple, update) => ({ ...tuple, ...update}),
    "crdt": (tuple, update) => {

    }
}
export interface Transaction {
    
}