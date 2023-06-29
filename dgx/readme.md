membership protocol.
within an epoch we need every peer to respond
to start an epoch we need at least one storage peer for every copyset (or data is lost)
to start an epoch we need at least enough previous members to deprive previous leader of votes.
to continue an epoch we need the leader and half the original membership?



startup:

ideally the first one to start will allow the others to connect with a secret 
when the first one starts it should know the entire configuration which will mostly be R2 secrets.

3 Directory nodes, and for each Data shard 3 r2 proxies. Data shards are as in Ram cloud able to move around and have a maximum size of 64 gb. This speeds recovery. Keys are placed by hash into the data shards. Data shards are assigned to storage nodes using copysets. (for < 3 nodes there is one copyset)

Secondary indices are managed as values in tuples, this is similar to how Cicada build btrees in its 2-layer array. we should investigate scalestore approach as a possible alternative. 













what if we stored opens? we would have to invalidate when keys changed. we would require database hits rather than signature checks.
potentially better approach is that approve( )-> jwt, then open jwt.

key -> string
string = 8 byte length + up to 1024-8 bytes
longer than 1016 bytes move to overflow pages 
(fileid, tupleid, offset, more )

val -> CopyInstructions

copy -> (note length is already implied. would be good to have some compression here? not necessary though)
  literal length data
  copy start, end

this doesn't prevent other operations from client's perspective, like append 
some types operations might be hard to optimize dynamically? It would be good to identify if we needed a structure that would allow sparsity or even reindexing like splice.




to swap in:
1. get ownership, but leave invalid
if evict needed, pick a slot that we own.
broadcast evict
2. read db
3. validate

negative rid indicates admin record. read/write if it is -device or admin.

oauth/passkey - login sends request to existing device, or creates new account.

the low 16 bits of rid are used for deltas. we can accomodate even more than 64K deltas by combining them logrithmically

eviction:
pick a slot that we own.
invalidate it with "evict" for data

write through cache:
normal zeus write
during validation, asychronously write disk

if a system crashes 


special files

fid:ns,rid:vs, data

ns = update | tuple

update:
rid = time
vs = peer

tuple:
rid = row id
vs = version
data = delta

fid = 0 -> Directory
rid = fileid
data = readkey,writekey etc.

fid = [peer] -> Sequence generator
rid = 


The update log is replicated per machine, then reads are interleaved during sync.
The sync can provide a vector clock[3] to make sure that it's getting all the updates.
This allows each peer to own its own log, otherwise access to a a database would be serialized and ping/ponged across the cluster.

we can manage this in the normal tuple store by taking a few bits of the file id 
[fileid:shard:time]
we can probably gain back some resolution by rotating the time at snapshots.
easier to use a covering index.



Every database has n~3 replicas. directory can keep their location
Every tuple has a current owner, directory keeps that.
Every proxy has a current set of clients, directory keeps that.

rifl:
write(rowid, device,lsn, value, readver) -> ts -> ack(rowid,device,lsn)

rifl: 
rpc (device,lsn) {
    rowid, readversion, update
    ...

}

is every tuple a log or a database? do the element ids get exposed? do they get owned?

does this mean every tuple would have the last write by every client? deleting the ack is the way.
maybe this returns to racing on version? racing on range of versions (possibly 1)



Send messages as 
headerlength: 16
payload: 32
shard: 16

Group commit, btree, checkpoints, aries

write pages to the page file.

Critical to not cut our performance in half on large writes; we must allow full pages to be flushed directly to disk. The client can make this happen by first writing all the pages, collecting pointers, then writing the pointers to the btree. This temporarily leaves pages in the log that are not tied to the tree, but this seems lesser of evils.

the wal will be trimmable, the page file will be trimmable, checkpointable.

distributed hermes/craq/LCR
each write has a primary shard based on the most recent group membership. This is the coordinator for the log write. When it applies the write, it sends invalid+data to the ring. 

LCR allows us to completely order the transactions, does that solve anything here?
Once the write is acknowledged, it can be returned to the client. Then a second round of ack can allow the replicas to mark it valid for reads. 

The LCR "log" is not what we want to store though, since it won't carry the btree information, etc.

To recover, a machine should first recover from its own wal.
Then, like Craq, it should insert itself and start copying tails.
How to sync though? All updates should be in a peer wal. The only thing we need to add is that we only trim at the least checkpoint of the cluster instead of our greatest checkpoint.

To incorporate websocket signaling we have a "signal" command { to: DeviceId }

when to increase epoch? how to re-establish membership?
if timeout/retry doesn't work, send to next{e} to every member.

how do we keep from duplicating a message? rifl? hash chain? "at"? force reader to check? vector clock?

write rpc.id->location atomically with the append.

write(log, client,lsn, value) -> pos -> ack(log,rpcid)

create table (log,client, lsn); check that lsn = lsnprev+1. we can keep this cached.

watermarks solve the problem, but add latency. the 1.5 rt only tells you the write succeeded, but not it's position.
what about the inv-ack though? it's timestamp can serve as a watermark? as long as the received time is less than the inv.ack time (lamport clock?) then order should be established by that. on recovery 


lookup (log,rpcid) 


what about moving the file? what about eliminating the extra inval copy?

3 way merge + log ordering
3 way merge is not convergent, but is when done in strict order.



Devices have a natural sharding because of the Ip ports, but 

Consider pargo style global processing?

log state | client state  | client_input (include client state change) | peer_input | io_contributions | io_deletions

-> client_operations


A big potential problem of pargo style vs faster style is tail latency caused by os scheduling. Even one thread going away is going to spike latency. unclear that we care for logs?

input can potentially be filtered by the io thread to delay for resources not in memory. 

Pargo style could still be used with hash tables, chained hash would work best. we simply fork join over the entire array.






Maybe server becomes authorization only and this becomes the performance critical signaling server. Can we make them linkable into a single monolith for ease of deployment though?

each shard can keep a list of free and available pages. eventually there will only be available.


Getting an name:
1. To claim an unused name, ask datagrove to sign the name/id pair.
2. To assign the name to a new device, use the existing device to sign the name/id pair.

Datagrove can put these assignments  into a transparency log. but then it has the same problems of merkesquare?

name->[set of certificates]
certificates are signed by datagrove? by whomever?

maybe tail servers should publish to each other and push for themselves. Can this be built into zeus? is it a transaction to queue into publish objects for each listener?
maybe each server keeps a publish queue and drains it, either to online users or offline.

Maybe its a completely different machine? A non-server could start a billion webrtc connections and do all the pushing. Everyone could try to start a webrtc session with a reconciler.

Say the log state keeps the listeners, their last read point, and the last sent timepoint. The node can keep a dirty list and sweep over them.


user selects an id. assume it is random. user publishes (id,pubkey)
users may elect to have notaries sign their ids with alternate id's like email.

If a device revokes its public key, then every site that has allowed access to this public key must rotate its key.

merklesquare requires that there is a signature for the the id. in our scheme this would be stored in the user database, thus compromising any device would compromise the name. There's no great way around this; we could give security conscious the choice of erasing this. Otherwise peers would not be able to sign revocations

what if we changed merklesquare to allow one of the set of signatures? does that improve anything? Now we can revoke the lost device, rotate the key on the database.

what if we make the entries be DID's, and then you follow that to get the name (instead of trying to look up the name directly) The name could be signed to the DID by datagrove.

Bootstrappin from oauth

System 1 uses oauth to validate your identity with Google. It gives you a key generated from its own secret * your oauth id.

System 2 takes the blinded key and returns a value, then you compute your secret key.

it doesn't work. System 1 has everything it needs to ask System 2 for your key. You trust one system, that's it. What about something like a mixnet, or riposte?

system 1 gives you signature indicating that you own your email.
you provide your blinded email to two different oprfs. They give you back keys that you mix. Problem is again that the system signing your email has all the power.
if you encrypt the email with a pin, the oprf could detect a compromise of the signing system, but it would be expensive. It would need to be per email address to avoid bring down everything with a red flag.

Each device has its own encrypted copy of the master key and its only passed by qr code or bip39. Now we want to sign this with a user key, so others can prove that device d belongs to user u, so they are willing to share a secret with d.

1. Start on chromebook. You are in with random device key, but anonymous. Now you sign in with chrome, datagrove signs your key and says "this device logged in with email e chrome at time x". Other people wanting to share information to e can do a query that returns all the keys that have been identified as associated with e, and seperately envelope those keys.

Most importantly your existing device can share information to the new device; a notification pops up that another device has logged in and ask you if you want to share keys with it. Before it does so it checks that datagrove's key has not been revoked.

What if we used a log just for the public keys associated with the that id? It would be easy for the owner to audit, and it would define for itself the owner. It would still allow equivocation though. we could use a merkesquare to point to such a log though.






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