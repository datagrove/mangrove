The job of host is to serve pages to the service worker installed for each subdomain. The pages maybe be change atomically which is handled by the service worker. host notes the change though, and any new sessions that are started are started with the new site.


what are going to do for seo? can we rely on the google executing the javascript? lighthouse scores may be a signal.

possible solutions:

ssg - we can render out a site periodically (nightly?) We could even serve this site initially. Host can try this when the user is not logged in any way, they might see an old version. There would have to be a force function or auto setting to allow it to run differently.

So if we serve the static to newcomers (a good thing, arguably), then it could make sense to try to pull it from r2 directly instead of paying fly.io for egress. 

One way to manage this is to put a copy of the site on ovh, but how do we direct the bots to scrape there? Maybe we should just go ovh straight up.

what if we had a static web site server on ovh, and the moment someone logged in they were immediately transitioned to fly.io. Not clear this makes a difference.




git's patch is closer to what we want then pack. pack in practice wants gobs of cpu, memory, and then gives you reverse deltas, we want forward deltas cheaply. (mercurial?)

host:
1. various logins
2. billing
3. compiling
4. pre-signed url

Each publish creates a new R2 object, maybe registers the new object in the ring? maybe replaces a root r2 node? Probably both.

host sites are ssg+islands. clients can connect directly to nodes generate dynamic pages. The router then needs to be somewhat hybrid between ssg and ssr; in the mold of an mpa that's made up of spas. 

every client is a database ( globally addressible) with bags of tuples. Each tuple has a place it wants to live, where it was born, and where it is now. sync transports tuples to where they want to go. host run webassembly routines and some hard coded stripe routines, but generally tries to do very little. 

Each site has at least one primary that sets the order of operations. For high availability they may be multiple primary sites. Generally there would just be two, although each of these could be clustered using scalestore. The core VSR ring decides if the backup should take over, if the primary lease expires. replication is by log shipping. backup and primary can split sites in the expected state of both running.


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

should I fork caddy? improve on it?

what api's do we need to support?

1. sftp? we could copy new versions, but probably have this already.
2. create new site x.datagrove.com 

/sites/owner/site/version/

// keep a map of lastest version. keep in session for each user.
create table site(
  owner text,
  site text,
  version text,
  primary key(owner, site, version)
)

// keep local cache, restore from r2 if needed.
Is it faster to pack pages into sets? Does this get in the way of incremental updates?
Is there a sweet spot for size, esp. since reads cost but bytes don't?
Should we use a root file to make the atomic commit? Probably poll it slowly, or?
If the website has a chat feature this just works by connecting to the node with webrtc. the node could also tell them the website has changed.

potentially the commit could be a tree, or delta of a tree, that maps names to hashes. That would let the service worker keep its cache valid. host could potentially cache the home page and the tree.







