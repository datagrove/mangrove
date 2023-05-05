export class Service extends Map<string, (params: any) => Promise<any>>{

}

export interface Watch {
    server: string
    stream: string
    schema: string
    table: string
    from: Uint8Array
    to: Uint8Array
    limit: number
    offset: number
    attr: string[]
}

export function toBytes(b: Buffer) {
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT)
}
