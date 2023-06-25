-- create table db (
--     id INTEGER PRIMARY KEY,
--     type text, 
--     name TEXT,
--     readkey text,
--     writekey text,
--     size INTEGER
--     );

-- if we race on the version, no need for rifl? 
-- we can periodically delete a range of versions and replace it with a snapshot.
-- would it help to have file:rowid? it's not like we are doing scans.
-- should we start by putting this in a file with fsync?

-- this still needs to be replicated, so that we can recover from a crash.
-- we can't rely on sqlite to generate it because they would overlap on the nodes
-- what about being unique to shards? we have no upper limit on number of crashes, so 16 bit distinguisher doesn't seem like enough.
create table counter(
    counterid INTEGER PRIMARY KEY,
    count INTEGER
);

-- updates will be partial order?
-- each coordinator will have a clock that will be mostly ordered
-- a concern is how to sync with clients
-- maybe push can manage this by taking the latest version?
-- how does push work anyway if clients can attach to any proxy?

-- update and tuple are replicated on every node.
create table update(
    fileid INTEGER,
    txid integer,
    data BLOB
)

create table tuple (
    id INTEGER PRIMARY KEY,
    version integer,
    data BLOB
    primary key (id, version)
    );

