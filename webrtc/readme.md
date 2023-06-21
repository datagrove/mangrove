
Maybe server becomes authorization only and this becomes the performance critical signaling server. Can we make them linkable into a single monolith for ease of deployment though?

How it might work:

1. client asks auth server for token, maybe this token is refreshable, stored locally so not every startup needs it.
2. send this token with every tail server request.
3. Client shards requests to tail server according to information from the auth server.

 http for better scalability? Cors to use from fetch? authorize to specific static host? can we link together in a monolith this way?

Auth api:
# signup(device, user)
Could be new user or new device
# updateProfile(device, changes, version) -> true|false

# join(device, site,credential)
Wave style authentication
# lease(site,log,credential) -> token
# refresh(token, refreshGuid)->token

Tokens should be much faster for the tail server to check since they only use symmetric operations. Policy would say how long a token is good for. Potentially backstop with explicit revocation list which would be very small. But if we have this backstop, do we still want refresh tokens?

should we check a signature on every lease? check for revocations ala wave?



Tail server api; websocket for latency. Handles online user notification, but defers to notification server. 
# connect(token)  
retrieve/cache profile from auth server
# lease(site,log)->handle,leader
# signal(leaderHandle, offer|candidate, data)
# read(handle, from)
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