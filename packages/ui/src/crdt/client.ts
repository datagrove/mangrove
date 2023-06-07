import { z } from "zod";
import { BaseClient } from "./cloud";
import {  Op } from "./crdt";



export class LocalStateClient extends BaseClient {
    async publish(path: string, ops: Op[])  {


    }
}

export class KeeperClient extends BaseClient {

    async read(path: string, start: number, end: number) : Promise<any[]> {
        return await this.rpc( "read", [start,end]) as any[]

    }
}

export class KeeperOwner extends BaseClient {

    write(id: string, a: any) {
        this.rpc("write", [id,a])
    }
}

export class HostClient extends BaseClient {
    
}


// interface used for the host to connect with the editor
export class EditorClient extends BaseClient {
    
}

type ZodAny =  typeof z.ZodObject<any>
type Service = {
    [key: string]: |  ZodAny | [ZodAny, ZodAny]
}

const z1 : ZodAny = z.object({})

export const HostService = {
    "sub": z.object({
        "path": z.string(),
        "start": z.number(),
    }),
    "unsub": z.object({
        "path": z.string(),
    }),
}

export const TabService = {
    "update": z.object({
        "path": z.string(),
        "ops": z.array(z.object({
            "op": z.any(),
        }))
    }),
}

// when first subscribing we might want a more efficient thing than every op
export const LocalStateService : Service= {
    "sub": z.object({
        "path": z.string(),
    })


}

export const KeeperService = {
    "read": [z.object({
        "path": z.string(),
        "start": z.number(),
        "end": z.number(),
    }), ]
}
export const KeeperHostService = {

    // async service, does 
    "write": z.object({
        "path": z.string(),
        "at": z.number(),
        "a": z.any(),
    })

}


// const Form = z.object({
//     name: z.string(),
//     phoneNumber: z.string(),
//   });