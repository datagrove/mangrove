-- name: GetSegment :many
select * from segment 
where fid = $1 and start > $2;

-- name: GetCredential :many
select * from credential
where name = $1;