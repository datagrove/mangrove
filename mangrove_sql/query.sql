-- name: GetSegment :many
select * from mg.segment
where fid = $1 and start > $2;

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