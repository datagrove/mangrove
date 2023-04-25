
create sequence if not exists nextfile;

create table  db(db serial  primary key, name text);

create table dbfile(db bigint, count smallint, path text, fid bigint unique, size bigint, mime text,
 primary key (db, count, path),
 foreign key (db) references db(db) on delete cascade
);


create table segment(fid integer, start bigint, data bytea, ts tsvector,
primary key (fid, start),
foreign key (fid) references dbfile(fid) on delete cascade
);


create table  org( did text, name text, primary key (did) );
create table if not exists credential( did text, name text, webauthn text,
 primary key (did, name) );




create table user_db(uid text, db bigint,  
    primary key (db, uid),
    foreign key (db) references db(db) on delete cascade,
    foreign key (uid) references org(did) on delete cascade );

CREATE INDEX ts_idx ON segment USING GIN (ts);