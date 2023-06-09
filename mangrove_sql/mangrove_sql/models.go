// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.17.2

package mangrove_sql

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type MgCredential struct {
	Cid   []byte      `json:"cid"`
	Oid   int64       `json:"oid"`
	Name  pgtype.Text `json:"name"`
	Value []byte      `json:"value"`
}

type MgDbentry struct {
	Fid   int64  `json:"fid"`
	Start int64  `json:"start"`
	Data  []byte `json:"data"`
}

type MgDblock struct {
	Oid    pgtype.Int8 `json:"oid"`
	Db     int64       `json:"db"`
	Name   []byte      `json:"name"`
	Serial pgtype.Int8 `json:"serial"`
}

type MgDbstream struct {
	Db       int64       `json:"db"`
	Fid      int64       `json:"fid"`
	Ownerdid pgtype.Text `json:"ownerdid"`
}

type MgDevice struct {
	Device   int64  `json:"device"`
	Webauthn string `json:"webauthn"`
}

type MgDeviceOrg struct {
	Oid    int64  `json:"oid"`
	Device int64  `json:"device"`
	Ucan   string `json:"ucan"`
}

type MgFile struct {
	Sid      int64            `json:"sid"`
	Count    int16            `json:"count"`
	Path     string           `json:"path"`
	Data     []byte           `json:"data"`
	Modified pgtype.Timestamp `json:"modified"`
	Size     int64            `json:"size"`
}

type MgFriendly struct {
	Name    string      `json:"name"`
	Sid     pgtype.Int8 `json:"sid"`
	Profile []byte      `json:"profile"`
}

type MgNamePrefix struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

type MgOrg struct {
	Oid        int64       `json:"oid"`
	Did        pgtype.Text `json:"did"`
	Name       string      `json:"name"`
	PrivateKey []byte      `json:"private_key"`
	Notify     []byte      `json:"notify"`
	Wallet     interface{} `json:"wallet"`
	Profile    []byte      `json:"profile"`
}

type MgOrgDb struct {
	Oid int64 `json:"oid"`
	Db  int64 `json:"db"`
}

type MgOrgMember struct {
	Oid    int64       `json:"oid"`
	Member string      `json:"member"`
	Ucan   pgtype.Text `json:"ucan"`
}

type MgPush struct {
	Sid  int64  `json:"sid"`
	Oid  int64  `json:"oid"`
	Mute []byte `json:"mute"`
}

type MgR2 struct {
	Key   string `json:"key"`
	Value []byte `json:"value"`
}

type MgSite struct {
	Sid        int64  `json:"sid"`
	Length     int64  `json:"length"`
	Lastcommit int64  `json:"lastcommit"`
	Bucket     string `json:"bucket"`
	Credential []byte `json:"credential"`
}

type MgSiteowner struct {
	Sid   int64   `json:"sid"`
	Oid   int64   `json:"oid"`
	Share float64 `json:"share"`
}

type MgTask struct {
	Oid      int64            `json:"oid"`
	Name     string           `json:"name"`
	Secret   []byte           `json:"secret"`
	Auth     []byte           `json:"auth"`
	TaskType string           `json:"task_type"`
	Task     []byte           `json:"task"`
	LastRun  pgtype.Timestamp `json:"last_run"`
	NextRun  pgtype.Timestamp `json:"next_run"`
	Chron    pgtype.Text      `json:"chron"`
}

type MgTasklog struct {
	Oid       int64            `json:"oid"`
	Timestamp pgtype.Timestamp `json:"timestamp"`
	Name      string           `json:"name"`
	Result    []byte           `json:"result"`
}
