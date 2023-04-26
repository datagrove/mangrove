create schema if not exists mg;

create table  mg.db(db serial  primary key, name text not null);

create table mg.dbfile(
    db bigint, 
    count smallint, 
    path text, 
    fid bigint unique, 
    size bigint, 
    mime text not null,  
    mt timestamp,
    primary key (db, count, path),
    foreign key (db) references db(db) on delete cascade
);

create table mg.segment(
    fid integer, 
    start bigint, 
    data bytea, 
    ts tsvector, 
    mt timestamp,
    primary key (fid, start),
    foreign key (fid) references dbfile(fid) on delete cascade
);

create table mg.dbfileh(
    db bigint, 
    count smallint, 
    path text, 
    fid bigint unique, 
    size bigint, 
    mime text not null,  
    mt timestamp,
    primary key (db, count, path, fid),
    foreign key (db) references db(db) on delete cascade
);

create table mg.namePrefix(
    name text primary key,
    count bigint not null
    );

create table  mg.org( 
    org text primary key, 
    name text unique, 
    is_user boolean not null
);
create table mg.org_db(org text not null, 
    db bigint not null,  
    primary key (org, db),
    foreign key (db) references db(db) on delete cascade,
    foreign key (uid) references org(org) on delete cascade );

create table mg.org_member(
    org org, 
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