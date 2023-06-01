
we can use sw.js to feed the cache from a http accessible btree

we don't want to use sqlite; too large

we can keep the top of the tree (or the whole tree) in index.html or sw.js

in theory we could take advantage of opfs, but do we really need it?

we just need the simplest of trees, or even a hash table.

It's really just a manifest that maps path->hash

x.mdx -> x.astro -> function -> htmlstring + 




