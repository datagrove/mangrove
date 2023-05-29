
export interface Rpc<T> {
    method: string
    args: T
    id: number
    more: Uint8Array
}

export type NotifyHandler = (r: Rpc<any>) => void
export class ListenerContext<T> {
    public constructor(public post: (x: any) => void, public state: T) {
    }
    log(...args: any[]) {
        this.post({
            method: 'log',
            id: 0,
            params: args,
        });
    }
}
export type ServiceFn<State> = {
    [key: string]: (context: ListenerContext<State>, params: any) => Promise<any>
}
