create schema if not exists mg;

create table  mg.org( 
    oid bigserial primary key,
    name text unique not null, 
    is_user boolean not null,
    password bytea,
    hash_alg text,
    email text unique not null,
    mobile text unique not null,
    pin text
);
create table mg.credential (
    oid bigint not null,
    id serial,
    name text,
    type text,
    value bytea,
    primary key(oid,id)
 );
create table mg.org_db(
    oid bigint not null, 
    db bigserial not null,  
    primary key (oid, db) );

-- each stream is written by a single device, did="" means shared stream written
create table mg.dbstream(
    db bigint, 
    fid bigserial,
    ownerDid text ,
    primary key (db, fid)
 );
 -- not ideal for postgres, needs key compression to be efficient
create table mg.dbentry(
    fid bigint,
    start bigint, 
    data bytea, 
    primary key (fid, start)
);

-- database locks
create table mg.dblock(
    oid bigint,
    db bigint,
    name bytea,
    serial bigint,
    primary key (db, name)
);

create table mg.name_prefix(
    name text primary key,
    count bigint not null
    );

create table mg.org_member(
    oid bigint, 
    member text, 
    ucan text, 
    primary key (oid, member) );


create table if not exists mg.device( 
    device bigserial primary key,
    webauthn text not null);

 create table if not exists mg.device_org(
     oid bigint not null, 
	 device bigserial not null, 
	 ucan text not null,
	 primary key (device, oid));
