import { ApiSet, Channel, Peer, apiCall } from "../abc/rpc";
import { LocalStateFromHost } from "../crdt/localstate_shared";


export interface DbLiteClient  {
    exec(sql: string, ...args: any[]): any
}
export function DbLiteClientApi(mc: Peer) : DbLiteClient {
    return apiCall<DbLiteClient>(mc, "exec") 
}