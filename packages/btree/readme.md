the problem with large outlines is estimating height when some things are open and some are closed.

this invalidates the idea that we could estimate purely based on position.

we need to transform our estimates in a non-obvious way.
(list, item,

one possibility is to actively insert/delete into a user specific list, so that it becomes a flat list.
in particular we might default to all closed, then as we open things, we mutate the list.

key, offset value store.

as a hack, we could load the tree completely into memory each time. build the api, then move to disk.

can we create a tree of listeners?

maybe consider the tab's adjusted menu as their own document, and the model is a list of documents ranges.
