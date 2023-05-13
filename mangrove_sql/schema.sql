create schema if not exists mg;

-- note that did, username, email and mobile are unique but can be null
-- this is needed so we can index them.
-- drop table mg.org;
create table  mg.org ( 
    oid bigserial primary key,
    did bytea unique,
    username text unique, --unique, but may be null if passkey
    name text not null, -- purely descriptive
    is_user boolean not null,
    password bytea not null,
    hash_alg text not null,
    email text unique,
    mobile text unique,
    pin text not null,
    webauthn text not null,
    totp text not null,
    flags bigint not null,
    totp_png bytea not null,
    default_factor int not null
);
create table mg.passkey (
    cid bytea unique not null,
    oid bigint not null,
    name text, -- not used, but could capture some context about device
    type text, -- not used, but could be version of passkey
    value bytea,
    primary key(cid)
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

