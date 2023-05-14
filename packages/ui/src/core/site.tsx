
export interface Site {
    did: string
    name: string
    caps: Caps
}

export interface Caps {
    read: boolean
    write: boolean
    admin: boolean
}

type Maybe<T> = Promise<[T?, Error?]>

export async function getSite(did: string): Maybe<Site> {
    return [{
        did: did,
        name: "datagrove",
        caps: {
            read: true,
            write: true,
            admin: true,
        }
    }, undefined]
}
