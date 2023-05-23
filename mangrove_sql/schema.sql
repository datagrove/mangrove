create schema if not exists mg;
create schema if not exists mu;

drop table if exists mg.org;
drop table if exists mg.task;
drop table if exists mg.tasklog;
-- note that did, username, email and mobile are unique but can be null
-- this is needed so we can index them.
-- drop table mg.org;
-- we don't publish any of this information, but will sign for its existence
-- should email and mobile be unique? what if I want two identities to recover to the same account? but if they login with gmail, that's all I have.
create table  mg.org ( 
    oid bigserial primary key,
    did text unique not null, 
    name text not null, -- purely descriptive, mostly for testing
    recovery bytea -- cbor encoded recovery information: methods email, phone, pin etc. empty array if no recovery options desired. may be encrypted by local server key.
);


-- use for proxy accounts when this server needs to do something on behalf of the user. 
-- generally the user will sign these requests

create table mg.task (
    oid bigint not null,
    name text not null, -- unique name for account by user.
    secret bytea, -- cbor encode whatever is needed; can use for totp. can be primary key for ssh credential etc. may be encrypted by local server key. may be encrypted by a key retrieved some way by the task.
    auth bytea, -- did and signature of the user authorizing this task.
    task_type text not null, -- type of task, e.g. totp, ssh, etc.
    task bytea, -- cbor encoded task information, e.g. totp secret, ssh public key, etc.
    last_run timestamp,
    next_run timestamp,
    chron text, -- cron string
    primary key (oid, name),
    foreign key (oid) references mg.org(oid)
);

create table mg.tasklog (
    oid bigint not null,
    timestamp timestamp not null,
    name text not null, -- unique name for account by user.
    result bytea
);

create table mg.friendly (
    name text primary key,
    oid bigint not null,
    foreign key (oid) references mg.org(oid)
);
-- use to limit the number of names assigned to one org
-- should one be the limit and have a separate redirect? that seems more complex to what end?
create index on mg.friendly(oid);

create table mg.site(
    sid bigserial primary key,  -- 64 bit integer assigned by host of record. offline creation uses negative numbers until one is assigned.
    root text not null, -- public key (DID) of owner. owner must be root signature 
    -- keep the length and tail here, the rest of the log is in r2
    length bigint not null, -- length of site log
    lastwriter bigint not null -- device id of last writer
);
-- everything goes into the site log, including the toc.
--     device bigint not null, -- device id is in the encrypted part.
-- conceptually this is in s3,
create table mg.r2(
    key bytea primary key, -- site id, offset
    value bytea -- ciphertext
);
-- more than passkey, cid is namespaced.
-- gmail://someone@gmail.com
-- p:passkey
-- can each of these credentials be recovered separately?
-- we need a secondary key anyway so user can view their credentials?
-- such an index is not leaking any additional information
-- most credentials require at least a username, most will request a password.

-- a normal credential might be a pw:user
create table mg.credential (
    cid bytea primary key,
    password_hash bytea,
    oid bigint not null,
    name text, -- not used, but could capture some context about device

    value bytea,
    foreign key (oid) references mg.org(oid)
 );
 create index credential_oid on mg.credential(oid);


 
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

