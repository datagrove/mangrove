


etcdish

directory: 3 chosen/trusted storage nodes. picked by leader.

a storage node is 2 pc's in 2 regions with s3 backup.

every client connects to a storage node. It creates files there; a backup is created on the backup region.


create(
  path: '',
  serialized: true
)
grant(path: ' ', time: , read, write, grant) -> handle
revoke(handle)

open(path: ' ', watchafter: time) -> handle
close(handle)

begin()
trim(handle, from, to) # needed?

write(handle, data, after: []ts) -> ts

# merge snapshots we need the client to rewrite?
# strategies generally partition in key and time, and then merge those to clean
# keyspace can 

the encrypted store doesn't know where keys overlap, and sadly even if we make the merger work with this reduced information the store learns information about the keys. a purely time based merge like rose would not have this property.

the prolly tree with a secure hash doesn't? sort of, because statisical expectations.
but instead of splitting size we could split each time layer by the first key with 00.. prefix. 


the job of the storage node is to allow timestamps to be monotonically increasing. If we pick an sstable committed to the log, it is not possible to ever have an sstable with a smaller timestamp (if we can read t2 we can read t1 < t2)

we could accomplish this by using N writes of the log, with M invalidations/validations. We could also potentially just read all the nodes? this seems odd for scaling though. It seems an ok use of zeus to manage a billion counters that can updated by the owner, but read by any replica.

We don't need to, but could certainly write the log entries to the owner/replica set. Unclear this is the right way to scatter the writes about though, vs say copysets. Another option is to write it directly to r2, and pipeline it. The "counter" could include the tail of the log (not large because this must pass with ownership and inval) and this could accumulate small writes.

The public tree is a different thing where we
1. Require that it be linear, not a graph. Publishers can race, but must rewrite when they lose.
2. Each linear timestamp resolves the graph up to that point.
3. We aggressively prune and merge to create an efficiently readable lsm tree. 

 each write in the public log represents a time interval, we can easily merge them asynchronously to prune the number of segments.


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







