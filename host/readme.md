The job of host is to serve pages to the service worker installed for each subdomain. The pages maybe be change atomically which is handled by the service worker. host notes the change though, and any new sessions that are started are started with the new site.

The pages are generated statically from a database. host will generate these in the background, but will pause requests to ensure that the correct page is served, so its a hybrid of ssg and ssr.

It seems likely there will be some reverse proxy in front of this (cloudflare) which impacts our ability to offer atomic site changes. With a handful of cdn's we can probably find a manual invalidation for each. Not exactly atomic but best we can do?

cloudflare:
The single-file purge rate limit for the Free subscription is 1000 urls/min. The rate limit is subject to change

For cache purges, the maximum length of a cache-tag in an API call is 1024 characters.

You can purge up to 30 cache-tags per API call and up to 250,000 cache-tags per a 24-hour period.

Another approach is to go all in on fly.io and manage our own edge?

Question:
Can we run astro and friends in a vm, or potentially web assembly, to allow general javascript to not pwn us? Astro needs node, node does not compile in wasm.

Alternately, maybe we force the software feeding host to provide static pages only. Doesn't this just move the spot though? and for some database tasks, full ssg could be unreasonable.

what if the fallback is just islands? no ssr. now host is just a reverse proxy. 

consider host running on fly.io
authors write into datanodes and write to (each) host directly.
readers execute apis directly on datanodes

should host maintain the data nodes then?
