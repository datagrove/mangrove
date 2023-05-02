create schema if not exists mg;

create table  mg.db(db serial  primary key, name text not null);

-- each stream is written by a single device, did="" means shared stream written
create table mg.dbstream(
    db bigint, 
    fid bigint,
    did text ,
    primary key (db, fid),
    foreign key (db) references mg.db(db) on delete cascade
);

create table mg.dblock(
    db bigint,
    name bytea,
    serial bigint,
    primary key (db, name),
    foreign key (db) references mg.db(db) on delete cascade
);


-- not ideal for postgres, needs key compression to be efficient
-- eventually having this clustered will be useful
create table mg.dbentry(
    db bigint,
    fid bigint,
    start bigint, 
    data bytea, 
    primary key (db, fid, start),
    foreign key (db,fid) references mg.dbfile(db,fid) on delete cascade
);


create table mg.namePrefix(
    name text primary key,
    count bigint not null
    );

-- orgs are users or groups, password is bcrypt, optional
create table  mg.org( 
    org text primary key, 
    name text unique, 
    is_user boolean not null,
    password bytea,
    hash_alg text
);
create table mg.credential (
    org text not null,
    id serial,
    name text,
    type text,
    value bytea,
    primary key(org,id),
    foreign key (org) references mg.org(org) on delete cascade
);
create table mg.org_db(
    org text not null, 
    db bigint not null,  
    primary key (org, db),
    foreign key (db) references mg.db(db) on delete cascade,
    foreign key (org) references mg.org(org) on delete cascade );

create table mg.org_member(
    org text, 
    member text, 
    ucan text, 
    primary key (org, member) );

create table if not exists mg.device( 
    device text, 
    webauthn text not null,
    primary key (device) );

 create table if not exists mg.device_org(
	 device text not null, 
	 org text not null, 
	 ucan text not null,
	 primary key (device, org));

CREATE INDEX ts_idx ON mg.segment USING GIN (ts);