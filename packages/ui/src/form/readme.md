# Documents

Each document is a set of logs, one for each device
An additional tuple points to one entry in one these logs as the last write (last writer wins)

docid | device | blockid | bytes
docid | device | pos

conceptually:

-- encrypted.
dbid | docid | deviceid | step_time | previous_step_device | previous_step_time | step_bytes

dbid | docid | deviceid | state_time | left_device | left_time | right_device | right_time | weight | key|value | aggregates?

-- managed by lock server.
dbid | docid | device | state_time

dbid | deviceid | did

this model gives us a single ordered tree of values that can be accessed by position or key. It represents a mini database of the state of each document.

conceptually deviceid's are dids (long) and the docid is serial number on that device.
we use a dictionary approach to compress the device id. before writing to a database the device acquires a serial number for that database.

The entries in the log are either linked list of steps (steps are application defined, but things like insert/delete) or triples of tree (value, left, right). Pointers are (device, pos) pairs.

The database reads the transactions in the log. Whenever a writer wins,

An editor always shows the device version of the document. There is a signal from the database whenever it has formed a new consensus state. If the consensus includes the current editor's state then the editor adopts it, otherwise it ignores it. Eventually the editor will get all its steps to the database, and the database will produce a version that includes the editor's state.

const [docs] = createDocuments(db, [docid,.. ]) // creating multiple documents ensures they are from a single snapshot.

interface SomeDocument {

}

docs are tree proxies, that lazily build proxies as the ux accesses the tree. we want to mostly see as lists and maps though.

a database could be a single document, we use document though to mean that part of a database that an editor might latch onto and not care about the rest. a database partition. these partitions can overlap though, so an editor can ask for enough documents to cover their interest.

merge dbid|docid

docid's are kept in the key = Table|primarykey
a document type is a table.

an editor subscribes to ranges in the table.

const sn = createSnapshot(db)
const [reader,writer] = createView(sn, range ... )
const [reader2,writer2] = createView( )

<For each={reader} >

</For>
or
<Table is=[reader, writer] start=' '>

</Table>

Table is conceptually a higher level For.

Forms are documents in a database but then compiled?

List of cells
one cell is a page divider.

forms must be allowed to change when data is inside them.
it doesn't need to be live, that's probably inefficient from SSR perspective.
we

formid |

const form = {
cells: [

    ]

}
createSettingsForm() {
// settings fields are known, so we can staticly build the form
let x = createLens(db, dbid, table)
return LoadedForm.new( [
makecell(cellopts, x.name1)
])
}

tableX = {
name: " "
col: {
name1: { },
name2: { }
}
}
