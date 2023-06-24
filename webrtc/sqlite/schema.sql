create table file (
    id INTEGER PRIMARY KEY,
    type text, 
    name TEXT,
    readkey text,
    writekey text,
    size INTEGER
    );

create table block (
    id INTEGER PRIMARY KEY,
    data BLOB
    );