import { z } from "zod";
import { BaseClient } from "./cloud";
import {  Op } from "./crdt";
import { JsonPatch } from "../lexical/sync";


// maybe we should do all the reconciliation in localstate and send back json patches?
// 
export interface LocalStateClient {
    subscribe(path: string) : {
        handle: number,
        doc: any
    }
    publish(handle: number, patch: JsonPatch) : JsonPatch
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



// const Form = z.object({
//     name: z.string(),
//     phoneNumber: z.string(),
//   });