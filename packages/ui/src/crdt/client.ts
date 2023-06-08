import { z } from "zod";
import {  Channel, Peer } from "./rpc";
import {  Op } from "./crdt";
import { JsonPatch } from "../lexical/sync";
import { createContext, useContext } from "solid-js";
import { LocalState } from "./localstate";


// maybe we should do all the reconciliation in localstate and send back json patches?
// 




export class KeeperClient extends Peer {

    async read(path: string, start: number, end: number) : Promise<any[]> {
        return await this.rpc( "read", [start,end]) as any[]

    }
}

export class KeeperOwner extends Peer {

    write(id: string, a: any) {
        this.rpc("write", [id,a])
    }
}

export class HostClient extends Peer {
    
}





export function connect<To,From>(f: From) : To {
    return {} as To
}
export function accept<Client>(ch: Channel) : Client {
    return {} as Client
}

// const Form = z.object({
//     name: z.string(),
//     phoneNumber: z.string(),
//   });