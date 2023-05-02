


-- if value is 1, then we need to insert
-- name: InsertLock :exec
insert into mg.dblock (db, name, serial) values ($1, $2, 1);

-- name: UpdateLock :exec
update mg.dblock set serial = $3 where db = $1 and name = $2;

-- name: GetDevice :one
select * from mg.device
where device = $1;

-- name: InsertDevice :exec
insert into mg.device (device, webauthn) values ($1, $2);

-- name: DeleteDevice :exec
delete from mg.device where device = $1;

-- name: ApproveDevice :exec
insert into mg.device_org (device,oid) values ($1, $2);

-- name: RevokeDevice :exec
delete from mg.device_org where device = $1 and oid = $2;

-- name: InsertOrg :exec
insert into mg.org (oid, name, is_user, password, hash_alg)
values ($1, $2, $3,$4,$5);

-- insert: UpdateOrg :exec
update mg.org set name = $1;

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

-- name: SelectOrg :one
select * from mg.org where name = $1;

-- name: SelectCredential :many
select * from mg.credential where oid = $1;

-- name: InsertCredential :exec
insert into mg.credential (oid, name, type, value) values ($1, $2, $3, $4);
