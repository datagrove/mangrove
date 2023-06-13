import { ApiSet, Channel, apiCall } from "../abc/rpc";
import { LocalStateFromHost } from "../crdt/localstate_shared";


export interface DbLiteClient  {
    query(sql: string, ...args: any[]): any
}
export function DbLiteClientApi(mc: Channel) : DbLiteClient {
    return apiCall<DbLiteClient>(mc, "query") 
}