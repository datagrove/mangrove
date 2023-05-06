package server

import (
	"sync"

	"github.com/go-webauthn/webauthn/webauthn"
)

type RegisterInfo struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
}
type Session struct {
	Oid int64
	UserDevice
	Device string // device for this session
	Secret string
	data   *webauthn.SessionData
	mu     sync.Mutex
	//Watch    []*Watch
	// maps a fid to a stream handle
	Handle   map[int64]StreamHandle
	Notifier SessionNotifier
	RegisterInfo
	Mobile    string
	Email     string
	Voice     string
	Challenge string
	Totp      string
	*LoginInfo
	DefaultFactor int
	FactorValue   string // hold a value while we are testing it.
}
type StreamHandle struct {
	*Stream
	flags int
}
type Stream struct {
	mu        sync.Mutex
	db        int64
	fid       int64
	openCount int64
	listen    map[*Session]int64
}
type SessionNotifier interface {
	Notify(handle int64, data interface{})
}

// returns a handle to the home session
// we should also return a client diff if they ask for an update.
type SessionStatus struct {
	Home int32 `json:"token,omitempty"`
}

// Device      map[string]*Device    `json:"device"`
type User struct {
	Alias  []*UserAlias
	Device []*UserDevice
}
type UserAlias struct {
	Id string `json:"id"`
}

type UserDevice struct {
	ID          string                `json:"id"`
	Name        string                `json:"name"`
	DisplayName string                `json:"display_name"`
	Icon        string                `json:"icon,omitempty"`
	Credentials []webauthn.Credential `json:"credentials,omitempty"`
	RecoveryKey string                `json:"recovery_key,omitempty"`
	Home        string
	User        *User
	LoginUcan   string `json:"login_ucan,omitempty"`
}

var _ webauthn.User = (*UserDevice)(nil)
