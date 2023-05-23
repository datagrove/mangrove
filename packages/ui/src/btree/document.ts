
// immutable log with multiple heads, one is ours

// a height tree needs to be able to override the stored document with disclosure deltas.
// we can use two trees and merge their information.


interface LogEntry {
    author: number,
    signature: Uint8Array,
}
function unpack(cbor: Uint8Array): LogEntry[] {
    return []
}

interface KeyposRange {
    begin: Uint8Array,
    beginOffset: number,
    end: Uint8Array,
    endOffset: number,
    limit: number,
}
// we have a list of signals that we need to update.
class LogDb {
    //

    // use numbers instead of fn to cross workers
    addKeyListener(range: KeyposRange, fn: (value: any) => void): number {
        return 0
    }

    removeListener(id: number) {
    }

}

// listeners
interface RangeSignal {

    removeListener: { [key: number]: (value: any) => void }


}

interface Snapshot {
}
function applyUpdates(sn: Snapshot, entry: LogEntry[]): Snapshot {
    return sn
}

function getList(): string[] {
    return []
}

// must be continually updated, like a materialized view.
// create table outline( id int, key, pos, listpos)
