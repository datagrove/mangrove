
-- name: Read :many
select * from mg.dbentry where db = $1 and fid = $2 and start between $3 and $4 order by start;

-- name: Write :exec
insert into mg.dbentry (db, fid, start, data) values ($1, $2, $3, $4);

-- name: Trim :exec
delete from mg.dbentry where db = $1 and fid = $2 and start between $3 and $4;

-- name: Lock :exec
update serial from mg.dblock where db = $1 and name = $2 and serial=$3 set serial=serial+1;

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
insert into mg.device_org (device,org) values ($1, $2);

-- name: RevokeDevice :exec
delete from mg.device_org where device = $1 and org = $2;

-- name: InsertOrg :exec
insert into mg.org (org, name, is_user)
values ($1, $2, $3);

-- insert: UpdateOrg :exec
update mg.org set name = $1;

-- name: NamePrefix :one
select * from mg.namePrefix where name = $1;

-- name: InsertPrefix :exec
insert into mg.namePrefix (name,count) values ($1,0) on conflict do nothing;
-- name: UpdatePrefix :one
update mg.namePrefix set count=count+1 where name = $1 returning count;