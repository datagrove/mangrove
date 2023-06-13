Ot/crdt needs a log of operations and a way to determine which operations are concurrent to each other.

To merge an operation we need to transform any concurrent operations to the end of the log.

each operation specifies its context; this is the last (device,tab, lsnMaxRead)  it has seen. If there is any operation (d,t,l) where l>lsnMaxRead, then it is concurrent.

if we have a global order?
a shadow reader on each device will read operations in global order and broadcast them to buffers.

local server will transform each op and sequence it in global order.

a shadow writer will retry sending based on locks. It will only send local ops that have "seen" every op in global order.'

rather than keys, why can't we use an index? would it be faster?

delete element would delete all it's children

insert element provides no children.

