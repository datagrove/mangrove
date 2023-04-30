

each connection has a user and a cache of checked permissions. revokes can be heavily metered.

each connection may watch database streams.
1. The main transaction log is a stream
2. There may be multiple snapshot streams. Each snapshot stream is maintained by a single contributor.

Typically you want to start with a snapshot, then read the log from that point and apply the changes that you care about.



the encryption model leaks considerable metadata, so consider before using.


