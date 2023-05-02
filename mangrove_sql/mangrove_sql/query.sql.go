// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.17.2
// source: query.sql

package mangrove_sql

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const approveDevice = `-- name: ApproveDevice :exec
insert into mg.device_org (device,oid) values ($1, $2)
`

type ApproveDeviceParams struct {
	Device int64
	Oid    int64
}

func (q *Queries) ApproveDevice(ctx context.Context, arg ApproveDeviceParams) error {
	_, err := q.db.Exec(ctx, approveDevice, arg.Device, arg.Oid)
	return err
}

const deleteDevice = `-- name: DeleteDevice :exec
delete from mg.device where device = $1
`

func (q *Queries) DeleteDevice(ctx context.Context, device int64) error {
	_, err := q.db.Exec(ctx, deleteDevice, device)
	return err
}

const getDevice = `-- name: GetDevice :one
select device, webauthn from mg.device
where device = $1
`

func (q *Queries) GetDevice(ctx context.Context, device int64) (MgDevice, error) {
	row := q.db.QueryRow(ctx, getDevice, device)
	var i MgDevice
	err := row.Scan(&i.Device, &i.Webauthn)
	return i, err
}

const insertCredential = `-- name: InsertCredential :exec
insert into mg.credential (oid, name, type, value) values ($1, $2, $3, $4)
`

type InsertCredentialParams struct {
	Oid   int64
	Name  pgtype.Text
	Type  pgtype.Text
	Value []byte
}

func (q *Queries) InsertCredential(ctx context.Context, arg InsertCredentialParams) error {
	_, err := q.db.Exec(ctx, insertCredential,
		arg.Oid,
		arg.Name,
		arg.Type,
		arg.Value,
	)
	return err
}

const insertDevice = `-- name: InsertDevice :exec
insert into mg.device (device, webauthn) values ($1, $2)
`

type InsertDeviceParams struct {
	Device   int64
	Webauthn string
}

func (q *Queries) InsertDevice(ctx context.Context, arg InsertDeviceParams) error {
	_, err := q.db.Exec(ctx, insertDevice, arg.Device, arg.Webauthn)
	return err
}

const insertLock = `-- name: InsertLock :exec
insert into mg.dblock (db, name, serial) values ($1, $2, 1)
`

type InsertLockParams struct {
	Db   int64
	Name []byte
}

// if value is 1, then we need to insert
func (q *Queries) InsertLock(ctx context.Context, arg InsertLockParams) error {
	_, err := q.db.Exec(ctx, insertLock, arg.Db, arg.Name)
	return err
}

const insertOrg = `-- name: InsertOrg :exec
insert into mg.org (oid, name, is_user, password, hash_alg)
values ($1, $2, $3,$4,$5)
`

type InsertOrgParams struct {
	Oid      int64
	Name     string
	IsUser   bool
	Password []byte
	HashAlg  pgtype.Text
}

func (q *Queries) InsertOrg(ctx context.Context, arg InsertOrgParams) error {
	_, err := q.db.Exec(ctx, insertOrg,
		arg.Oid,
		arg.Name,
		arg.IsUser,
		arg.Password,
		arg.HashAlg,
	)
	return err
}

const insertPrefix = `-- name: InsertPrefix :exec
insert into mg.name_prefix (name,count) values ($1,0) on conflict do nothing
`

func (q *Queries) InsertPrefix(ctx context.Context, name string) error {
	_, err := q.db.Exec(ctx, insertPrefix, name)
	return err
}

const namePrefix = `-- name: NamePrefix :one
select name, count from mg.name_prefix where name = $1
`

func (q *Queries) NamePrefix(ctx context.Context, name string) (MgNamePrefix, error) {
	row := q.db.QueryRow(ctx, namePrefix, name)
	var i MgNamePrefix
	err := row.Scan(&i.Name, &i.Count)
	return i, err
}

const read = `-- name: Read :many
select fid, start, data from mg.dbentry where fid = $1 and start between $2 and $3 order by start
`

type ReadParams struct {
	Fid     int64
	Start   int64
	Start_2 int64
}

func (q *Queries) Read(ctx context.Context, arg ReadParams) ([]MgDbentry, error) {
	rows, err := q.db.Query(ctx, read, arg.Fid, arg.Start, arg.Start_2)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []MgDbentry
	for rows.Next() {
		var i MgDbentry
		if err := rows.Scan(&i.Fid, &i.Start, &i.Data); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const revokeDevice = `-- name: RevokeDevice :exec
delete from mg.device_org where device = $1 and oid = $2
`

type RevokeDeviceParams struct {
	Device int64
	Oid    int64
}

func (q *Queries) RevokeDevice(ctx context.Context, arg RevokeDeviceParams) error {
	_, err := q.db.Exec(ctx, revokeDevice, arg.Device, arg.Oid)
	return err
}

const selectCredential = `-- name: SelectCredential :many
select oid, id, name, type, value from mg.credential where oid = $1
`

func (q *Queries) SelectCredential(ctx context.Context, oid int64) ([]MgCredential, error) {
	rows, err := q.db.Query(ctx, selectCredential, oid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []MgCredential
	for rows.Next() {
		var i MgCredential
		if err := rows.Scan(
			&i.Oid,
			&i.ID,
			&i.Name,
			&i.Type,
			&i.Value,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const selectOrg = `-- name: SelectOrg :one
select oid, name, is_user, password, hash_alg, email, mobile, pin from mg.org where name = $1
`

func (q *Queries) SelectOrg(ctx context.Context, name string) (MgOrg, error) {
	row := q.db.QueryRow(ctx, selectOrg, name)
	var i MgOrg
	err := row.Scan(
		&i.Oid,
		&i.Name,
		&i.IsUser,
		&i.Password,
		&i.HashAlg,
		&i.Email,
		&i.Mobile,
		&i.Pin,
	)
	return i, err
}

const trim = `-- name: Trim :exec
delete from mg.dbentry where fid = $1 and start between $2 and $3
`

type TrimParams struct {
	Fid     int64
	Start   int64
	Start_2 int64
}

func (q *Queries) Trim(ctx context.Context, arg TrimParams) error {
	_, err := q.db.Exec(ctx, trim, arg.Fid, arg.Start, arg.Start_2)
	return err
}

const updateLock = `-- name: UpdateLock :exec
update mg.dblock set serial = $3 where db = $1 and name = $2
`

type UpdateLockParams struct {
	Db     int64
	Name   []byte
	Serial pgtype.Int8
}

func (q *Queries) UpdateLock(ctx context.Context, arg UpdateLockParams) error {
	_, err := q.db.Exec(ctx, updateLock, arg.Db, arg.Name, arg.Serial)
	return err
}

const updatePrefix = `-- name: UpdatePrefix :one
update mg.name_prefix set count=count+1 where name = $1 returning count
`

func (q *Queries) UpdatePrefix(ctx context.Context, name string) (int64, error) {
	row := q.db.QueryRow(ctx, updatePrefix, name)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const write = `-- name: Write :exec
insert into mg.dbentry (fid, start, data) values ($1, $2, $3)
`

type WriteParams struct {
	Fid   int64
	Start int64
	Data  []byte
}

func (q *Queries) Write(ctx context.Context, arg WriteParams) error {
	_, err := q.db.Exec(ctx, write, arg.Fid, arg.Start, arg.Data)
	return err
}
