import { Peer, apiCall } from "../abc/rpc";


export interface DbLiteApi  {
    exec(sql: string, ...args: any[]): any
    close(): Promise<void>
}
export function dbLiteApi(mc: Peer) : DbLiteApi {
    return apiCall<DbLiteApi>(mc, "exec") 
}