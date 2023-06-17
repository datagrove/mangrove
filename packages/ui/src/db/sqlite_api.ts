import { Peer, apiCall } from "../abc/rpc";


export interface DbLiteClient  {
    exec(sql: string, ...args: any[]): any
}
export function DbLiteClientApi(mc: Peer) : DbLiteClient {
    return apiCall<DbLiteClient>(mc, "exec") 
}