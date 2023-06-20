
key: number
method: number
author: number
id: number
op: ins|del|upd
value: string
pos: number

we can lease registers from the site leader. The site leader can be responsible to create the snapshot, the register leader writes to the site leader writes to the cloud (if cloud enabled, if not then the leader is the cloud and it stops there). The tuple tree can contain a summary of the register (in most cases all of it), and a pointer to register log/snapshot. as the register leader updates the value, it potentially:
1) replaces the summary
2) adds an update to the log
3) update the snapshot.
4) the site leader notifies listeners, this may not be low latency enough, but simplifies some things.
5) potentially the leader revokes the lease and provides it to a new writer, so currently all writes will hit the leader. This is not really a bad thing, since the leader needs these writes for it's own copy anyway. The real pain to the leader would be amplified reads, and these are handled by writing to the cloud and redirecting the reads to that.



Subscribers can send updates to the register leader, if they fail the register leader provides them with the updates? or do they get these in order from the site leader and potentially the cloud if the site leader defers? I think to start lets try the site leader 

R2 might not be the right api for snapshots. Maybe we are better off creating a paged service. potentially the cloud server can redirect reads to an r2 bucket, although more thought is needed on this. umbra writes to variable page sizes, but this may be problematic in the browser since we have even less control of memory; you can't even find available memory without asking and catching exceptions. Potentially we can try to create new ArrayBuffers, then as long as we have at least one of each size, we can evict as a last resort. This raises deadlock issues etc. Seems like it might be too much trouble for the application. Also we don't really get direct pointers from the wasm space anyway, so we don't get the juice for the squeeze. wasm multi-memory or 64 bit wasm may be needed to make revisiting this worthwhile. Neither seems to be coming soon.

some values will have two values: global consensus and local value. These will eventually converge. When they converge (no outstanding local edits) then local editors are notified to update their view. As long as they are not converged, the editor stays on the local value.

note that peers may exchange data about multiple sites that they share, and may be leaders on different site sets.

we need a kind of state machine that processes transactions one 64K block at a time
it would be nice if normal transactions were not blocked by bulk transactions. the general idea is to model a promise; a normal transaction can indicate the future existance of a blob, that the bulk transaction then provides. this is even more difficult if the "blob" is a set of tuples, because how do we promise the existence of a set of undetermined tuples? This is even more troubled by the prospect that to the sending user, this transaction is already in some sense complete. 
one practical solution would be to use two sites; then bulk transactions on the second site. Should this be a standard then, that every site has a bulk fork and a normal fork?

create table xxx (      , log "async")
this would allow xxx to be updated asynchronously, effectively two sites instead of one. How hard is this for the application developer to reason about? forking would require a vector clock that specified the state of both.

when beginning a transaction we would specify the site.log (or log.site)

we need a log transformer that takes log entries from a peer attempts to write them to a leased log. It may fail due to locks, in which case it will pause and let the peer rebase the subsequent transactions.

bulk transactions themselves need to be accomplished by first transferring the blobs, then a transaction that loads the blobs. This will fix most, but not all the problems. One large attachment would still block all the chats for example. It may be that we want to not completely offline both logs; the attachment log could be a cache.


// to watch the database state, we want a signal for when the buffer state or the doc state changes



// we need to initialize the MvrServer with a host for its user configuration
// from there we can access other servers, but we need to store data to share among the user's devices


// we can broadcast service status and range versions


// each worker runs a lock server over webrtc
// we can subset the reliable ones and shard the locks.
// 

append(author,id, streamtail)

streamtail {
  op: key|table|col|id|setpos|insert|delete|replace|lock
  value: uint8array[]
}
streamback {
  op: boolean[]
}

uint8Array is utf8, with the first character as the op.
this is arguably minimal.
lock lasts one op. it doesn't need to be logged.
what does locking do to synchronizing? 



pagemap for each contributor; use 4-16K pages, overwrite tail, (r2 though? when do we hit issues?)

consensus log:
(author,skip,count,alloc)|

 // skip and count should be smallish numbers, save space over start, end? alloc gives more pages to the author.



Multi-value registers, with global sequencing.

# 3-way rebase

when locks fail for a transaction, the values must be rebased with a merge, the default merge is 3-way: the current local value (left), the current global value (right), and their most recent common ancestor (base).

each tag has a merge algorithm, each node has an id. some nodes allow text content.

span ids are in the result if their parent is in the result.

1. block id is in result if
  (left + right)
  (!base + left)
  (!base + right)
2. block id is not in result if
  (base + !left)
  (base + !right)

run merge on each node that is in the result, but has different values

For elements with text children, perform a word based, tag soup 3-way merge, then run tidy over them to rebuild the spans.

For elements without text children we are only looking for the best way to interleave inserts for each side.
1. arrange each side in alternating matching, merging, and inserted blocks
2. for inserted blocks we arbitrarily set left before right.

a B c 

updates use procs that return
2. tuple pointer; this allows use to check the cache.




ranges don't work with tuple pointers because these are not in order
as we 

# multiple global values

what if we allow multiple global values? now the reader must first successively merge all the global values, then merge to their local value. if this succeeds, it supercedes all these values. It's clear that this can only work for small windows, it's not clear that > 1 is desirable. 


# locks
the lock(v,n) succeeds if the current value x is  v >= x - n. A successful transaction moves the value to x+1


the cloud will deliver log length notifications. in the background the worker will read these logs and apply them to the local database. It will prioritize the active site.

# device logs

each device is assigned unique id by the cloud server. each device can use this to write single writer forks of large data items, and then reference these items in a transaction to the site log.

when writing a proposal the mvr will reference the most advanced log entry it has read. This creates a gap of time where multiple values may exist. each field has a merge rule to resolve this at read time.

the field is kept in a blob in sqlite with all its values, but not all its history. history is kept in reverse format in a separate table: create table history(url,time, update). this table is compressed in 10 minute intervals.

when a write fails due to sequence locks, the write will first bring itself up to date, rewriting or droping its modifications to adjust to the newest writes.
operations: ins(prev_sibling) del(key). no deleting the root. no deleting the fake "head" of each child list. 
for del if the key was deleted, drop the operation.
for ins if the prev_sibling was deleted we want to position where the tombstone of the prev_sibling would be.


watcher

multiple devices; we need a way to read(after: time)
it would be nice to be able to collapse the database to aggregate

update(id, length, time)

select id,length where time > lastread

the lockserver can keept the last time and send this as oldtime, newtimes

