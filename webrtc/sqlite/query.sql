-- file: GetDb :one
select * from file where id=?

-- block: GetBlock :many
-- inclusive range
select * from block where id between ? and ?



