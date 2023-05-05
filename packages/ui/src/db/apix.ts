import { Ws } from "./socket"


// we can keep a memory only temp table for building transactions

// to have a database server we need a log?
// 


export class Service extends Map<string, (params: any) => Promise<any>>{

}

export const api = new Service

api.set('add', async (params: {x:number,y:number}) : Promise<number> => {
    return params.x + params.y
})


// the main things we want to get from our shared worker are streamed presentations and cell updates

// the main thing we send to our shared worker is cell updates

interface Tx{

}

api.set('commit', async (params: {tx:Tx}) : Promise<void> => {

})


// read a range of cells
// column families are pax dsm
//cells are server.stream.table.family.[from,to]
// once we read the range we subscribe to updates.

api.set('read', async (params: {
    server: string, 
    stream:string,
    schema: string, 
    table:string,
    family:string,
    from:string,
    to:string}) : Promise<void> => {

})

api.set('listen', async (params: {key:string}) : Promise<any> => {

})

