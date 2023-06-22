
Maybe server becomes authorization only and this becomes the performance critical signaling server. Can we make them linkable into a single monolith for ease of deployment though?

How it might work:

1. client asks auth server for token, maybe this token is refreshable, stored locally so not every startup needs it.
2. send this token with every tail server request.
3. Client shards requests to tail server according to information from the auth server.

 http for better scalability? Cors to use from fetch? authorize to specific static host? can we link together in a monolith this way?

Auth api:
# various: signup(device, user),login, refresh
Could be new user or new device, multiple apis based on auth choices
# updateProfile(token,device, changes, version) -> true|false, comment list
profile here tells us which subsets of notifications matter to us, adjust login options
is changes really helpful here? or better to do full refresh? database transactions? do we need ordering? maybe changes here is transactions to a database that is shared, is always leasted by the auth server then? does auth server need webrtc then? auth server in node, as bot? allow websocket based leader connections?
# declare(wavedoc)
maybe this replaces updateProfile

# join(device, site,credential)
Wave style authentication
# lease(site,log,credential) -> token
# refresh(token, refreshGuid)->token
# claim(user, namespace, name) -> integer

Tokens should be much faster for the tail server to check since they only use symmetric operations. Policy would say how long a token is good for. Potentially backstop with explicit revocation list which would be very small. But if we have this backstop, do we still want refresh tokens? do we need wave style and tokens? can we get good enough performance by caching? is security weaker in any way? does it make sense to create a new profile on every change and declare that in the wave database? do we need queries of who holds what capability? is that even practical? create table(user, site, log, credential)? Is this too invasive? seems like its information we need though.

should we check a signature on every lease? check for revocations ala wave?

for scalability we can have a proof server that converts an attestation to a shared secret.

Signaling server

recovery
when a user shard dies, the tail of writes is indeterminate. The leader may also die, and then writer is left to proceed with getting its writes sequenced.

1. It tries to be leader. If it succeeds, it compares its last read to new tail
2. If it fails, it resends to new leader. Then new leader must do the same examination.


Tail server api; websocket for latency. Handles online user notification, but defers to notification server. 
# connect(token)  
token declares device, user. retrieve/cache profile from auth server, lazy fetch site access from auth table.
# lease(site,log)->handle|clientHandle|needproof
call auth server first time, then cache.
# webrtc_signal(clientHandle, offer|candidate, data)
leaderHandle can be random. we could send offer premptively from leader or aspirant, but 99% of time this is not used.
we can scan a queue to discover new attestations and revokations and use that to update our access database.
# attest(attestation)  

# read(handle, from) -> data|redirect
# write(handle, at, number)

private apis
# revoke(jwt) (from auth)

uses
notification server

Notification Server - maybe http is more scalable here? should we keep it up to date on presense information, or as we go? Maybe we mute when they are online, then unmute when they disconnect. Maybe the only connections are from the tail server and the auth server though, then these are continual? or http from clients and sockets to servers.
# publish(site, length) 
# mute|unmute(user)
Internal, only from tail server

# update(token, user, version, changes[]) -> true|false
internal, only from auth server

return false if the previous update version is lost and then it will send the entire subscription state (version 0)
worth it? seems silly to send the entire state to mute or unmute a channel. also if the tokens are expired, do they need to gather new tokens? if we didn't expire this kind of token (e.g. signature), does the notification server then have the work of check for revocation? do we need to anyway with tokens? The publication server doesn't share anything really secret, so revocation seems irrelevant. We can get one token for the entire file for a sync. 

Changes
join(device, site)
mute(device,site, duration)
unmute(device,site,duration)
leave(device,site)





Tail server client api
# _revoke(handle)
# _signal(handle,device, data)
Signaling pipe from lease wannabe to 
# _nack(