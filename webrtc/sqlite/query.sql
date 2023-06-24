

-- name: Block :many
select * from block where id between ? and ?

-- name: Db :one
select * from file where id=?