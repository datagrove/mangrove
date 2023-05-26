


-- if value is 1, then we need to insert
-- name: InsertLock :exec
insert into mg.dblock (db, name, serial) values ($1, $2, 1);

-- name: UpdateLock :exec
update mg.dblock set serial = $3 where db = $1 and name = $2;

-- name: GetDevice :one
select * from mg.device where device = $1;

-- name: InsertDevice :exec
insert into mg.device (device, webauthn) values ($1, $2);

-- name: DeleteDevice :exec
delete from mg.device where device = $1;

-- name: ApproveDevice :exec
insert into mg.device_org (device,oid) values ($1, $2);

-- name: RevokeDevice :exec
delete from mg.device_org where device = $1 and oid = $2;

-- name: InsertOrg :one
insert into mg.org (oid,did,name,notify) values ($1, $2, $3, $4) returning oid;

-- name: UpdateOrg :exec
update mg.org set did = $2, name = $3, notify = $4 where oid = $1;

-- name: SelectOrg :one
select * from mg.org where oid = $1;

-- name: AvailableName :one
select count(*) from mg.org where name = $1;

-- name: SelectOrgByName :one
select * from mg.org where name = $1;

-- name: NamePrefix :one
select * from mg.name_prefix where name = $1;

-- name: InsertPrefix :exec
insert into mg.name_prefix (name,count) values ($1,0) on conflict do nothing;

-- name: UpdatePrefix :one
update mg.name_prefix set count=count+1 where name = $1 returning count;

-- name: Read :many
select * from mg.dbentry where fid = $1 and start between $2 and $3 order by start;

-- name: Write :exec
insert into mg.dbentry (fid, start, data) values ($1, $2, $3);

-- name: Trim :exec
delete from mg.dbentry where fid = $1 and start between $2 and $3;

-- name: InsertCredential :exec
insert into mg.credential (cid, oid, name, value) values ($1, $2, $3, $4);

-- name: UpdateCredential :exec
update mg.credential set  value = $2 where cid = $1;

-- name: SelectCredential :one
select * from mg.credential where cid = $1;

-- name: SelectCredentialByOid :many
select * from mg.credential where oid = $1;

-- name: DeleteCredential :exec
delete from mg.credential where cid = $1;

-- name: InsertPush :exec
insert into  mg.push(sid,oid,mute) values($1,$2,$3);

-- name: DeletePush :exec
delete from mg.push where sid = $1 and oid = $2;

-- name: SelectPush :many
select mute, notify from mg.push join mg.org on (mg.push.oid = mg.org.oid)  where sid = $1;

-- name: SelectSite :one
select * from mg.site where sid = $1;

-- name: InsertSite :one
insert into mg.site (length,lastcommit) values (0,0) returning sid;

-- name: InsertFriendly :exec
insert into mg.friendly (sid, name) values ($1, $2);

-- name: DeleteFriendly :exec
delete from mg.friendly where sid = $1 and name = $2;

-- name: SelectFriendly :many
select * from mg.friendly where sid = $1;

-- name: InsertOwner :exec
insert into mg.siteowner (sid, oid,share) values ($1, $2,$3);

-- name: DeleteOwner :exec
delete from mg.siteowner where sid = $1 and oid = $2;

-- name: UpdateLength :exec
update mg.site set length = $1 , lastcommit = $2 where sid = $3;


-- name: SelectR2 :one
select value from mg.r2 where key = $1;

-- name: InsertR2 :exec
insert into mg.r2 (key, value) values ($1, $2);

-- name: UpdateR2 :exec
update mg.r2 set value = $2 where key = $1;

-- name: ListFiles :many
select * from mg.file where sid = $1;

-- name: InsertFile :exec
insert into mg.file (sid, count, path, size, modified, data) values ($1, $2, $3, $4, $5,$6) on conflict do update set count = $2, size = $4, mtime = $5, data = $6;

-- name: ReadFile :one
select * from mg.file where sid = $1 and count=$2 and path = $3;

-- name: DeleteFile :exec
delete from mg.file where sid = $1 and count = $2 and path = $3;
