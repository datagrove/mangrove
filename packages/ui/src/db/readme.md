

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

