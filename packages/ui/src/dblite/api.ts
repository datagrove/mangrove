import { ApiSet, Channel, apiSet } from "../abc/rpc";
import { LocalStateFromHost } from "../crdt/localstate_shared";


export interface DbLiteClient extends ApiSet {
    query(sql: string, ...args: any[]): any
}
export function DbLiteClientApi(mc: Channel) : DbLiteClient {
    return apiSet<DbLiteClient>(mc, "query") 
}