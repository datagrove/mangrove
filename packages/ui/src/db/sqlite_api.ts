import { Peer, apiCall } from "../abc/rpc";


export interface DbLiteApi  {
    exec(sql: string, ...args: any[]): any
}
export function dbLiteApi(mc: Peer) : DbLiteApi {
    return apiCall<DbLiteApi>(mc, "exec") 
}