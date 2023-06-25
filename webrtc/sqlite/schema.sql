create table db (
    id INTEGER PRIMARY KEY,
    type text, 
    name TEXT,
    readkey text,
    writekey text,
    size INTEGER
    );

-- if we race on the version, no need for rifl? 
-- we can periodically delete a range of versions and replace it with a snapshot.
create table tuple (
    id INTEGER PRIMARY KEY,
    version integer,
    data BLOB
    primary key (id, version)
    );

