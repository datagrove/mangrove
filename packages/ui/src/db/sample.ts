import { encode, decode } from "cbor-x"
import { DbTable } from "./client"
import { toBytes } from "./data"

// we can generate a function for each table to get cells?
type ProfileKey = {
    id: number
}
type Profile = {
    id: number
    name: string
}

export const profile: DbTable<Profile, ProfileKey> = {
    name: "profile",
    encode: (p: Profile) => toBytes(encode(p)),
    decode: (b: Uint8Array) => decode(b),
    encodeKey: (k: ProfileKey) => toBytes(encode(k)),
    decodeKey: (b: Uint8Array) => decode(b)
}
