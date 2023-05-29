
// sequencer interface should be bytes to allow encryption? cbor encode/decode?
export interface Tx {
    lock: { [key: string]: number }  // locks must advance by 1 or tx fails
    key: Uint8Array[]
    value: Uint8Array[]
}
export interface StateChange {
    tx: Tx[]
    gsn: number
    lsn: number
    reject: number
}

// each snapshot is an entry in the device log
export interface Snapshot {
    device: Uint8Array
    key: Uint8Array
    lsn: number
}

// each app has a shared worker, and that shared worker has one sequencer
// it can also keep things in unencrypted state.
export interface Sequencer {
    device: Uint8Array
    cred: Uint8Array
    commit(tx: Tx): void
    listen(key: Uint8Array, f: (s: StateChange[]) => void): Snapshot
    unlisten(key: Uint8Array): void
    // write to a device log
    write(lsn: number, data: Uint8Array): void
    read(device: Uint8Array, entries: number[]): Promise<Uint8Array[]>
}
