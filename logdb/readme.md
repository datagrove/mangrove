16 bit slot header points to 4 byte alligned blocks with a tuple state. tuple states share data with previous states.

might be better to just use 64 bit slot headers and point directly.

log has to be separate from the pages
snapshots are like backups

operations

update_cell([updates] )
update_list(lptr, from, to)
read_cell(from, to ) []entry

-- cell lists can point to child lists
read_child_list(lptr, from, to) []entry

the log is write optimized binary tree; most space in each node is reserved for a buffer
when a node overflows

make a cbor vector of all the updates, write that to the lo

updates
server/site/table (dictionary)
primary []byte
column int
session int
begin int
end int
payload []byte
previous update.

when the buffer overflows we

node {
left int64
right int64
key (lex-packed )
payload
}
