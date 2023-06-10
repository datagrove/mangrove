

To insert a row into a spreadsheet we generate a gid and insert it into the consensus vector. 

To create a cell, we have a table 
(ss_rowid, sheet_gid, cell_gid, row_gid, contents)

create table spreadsheet( row_vector, column_vector )

create table spreadsheet_cell( )


How does this work when we nest? Spreadsheets in documents, documents in spreadsheets?

Here linking and embedding are identical; everything is embedded in the database

link("table", gid)

inside a lexical document we have tables (or prefer our own embeds)

create table document(text)
// not really, but conceptually?
create table document_format(start, end, tag )

embedTable( 999,999, ('table', rowid))

TablePatch

jsonpatch already just looks like a key/value store: (op, path, value)
If we said that cells can be vectors of keys, then we already have full json, easier yet if cells can be arrays or objects
however its not obvious how to efficiently maintain the schema in this manner.

interval tree as table partition

It might make more sense to treat it as json and use the json extensions already gaining popularity.

should we convert json patch to attributed strings? can we do it efficiently? from lexical directly to attributed strings? schema check attributed strings?

format(start, end, tag)

this does not avoid transformation; we must transform to create the host shadow; each operation is behind, and we have full expense. We could save a little effort by requiring that only one merged change be in flight at a time. This cuts out the effect removal phase of general transformations.

states:
1. proposal outstanding
2. no proposal, but pre-prosal collected
3. no proposal, no pre-prosal; coalesce shadow and local

This might make it easier to pre-coalesce as well: every time we get new ops:
1. start with shadow + server changes
2. forward the proposal through the server changes, add to 2
3. remove the proposal from new changes  and add to 2
4. apply to editor (doesn't need a true diff per se, but some minimal changes for performance.)

does localstate/tabstate impact this? do we have steps/shadows/buffer at each hop? can we avoid any?

can we view localstate as truth, and the server as something that just another buffer that is ahead/behind this state?

this requires that the server is pre-aggregated, since it also represents a collection of editors at different states.
this view is also not correct, since the server order decides which formats are accepted. so it's better to view localstate as the aggregator.

one thing to consider is if we can use rough json patches to keep the local buffers in sync. I think the primary issue with this is transforming the selection which is different in every pane.

we could extend this to require that steps be no more than K behind, and that to recover the client must rebase. In this case we have the waste that every client decides for themselves that the operation is too old, but this should almost never happen.
(never going to exceed 24 hours, for example.)

the batching doesn't help as much as we'd like though, since batches are interspersed from different clients; each is "behind" by a different amount.

1. Local buffers retry with local state
2. local state retries with global state.

localstate has 
1. converged local
2. proposed global
3. recent global

1. successful update from local
   if no proposal, make one. 

2. success from server
   proposed global is now global
   use converged local to trivially generate new proposal


3. reject from server
   a) merge converged local to new proposal
   b) generate a new proposal (transform based on new inserts)

Deletions are formats
Formats don't occupy space (the are sorted by their length)
Formats have an "invalid" property that nullifys them.
After transform, invalidate formats that don't nest. (this could be more complex to account for div/p b/i etc. seems unnecessary though and not clearly better; easier to say "command conflict" then "command broken into pieces"






















