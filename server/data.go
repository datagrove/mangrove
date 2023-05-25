package server

import (
	"sync"

	"github.com/datagrove/mangrove/logdb"
	"github.com/go-webauthn/webauthn/webauthn"
)

type RegisterInfo struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
}

// each session can have multiple sockets attached ot
type Session struct {
	mu  sync.Mutex
	Oid int64
	PasskeyCredential
	Device string // device for this session
	Secret string
	data   *webauthn.SessionData
	//Watch    []*Watch
	// maps a fid to a stream handle
	Handle   map[int64]StreamHandle
	Notifier SessionNotifier
	RegisterInfo
	Cid           string
	Mobile        string
	Email         string
	Voice         string
	Challenge     string
	Totp          string
	DefaultFactor int
	FactorValue   string // hold a value while we are testing it.
	CredentialId  int64
	db            logdb.Session
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
	Device []*PasskeyCredential
}
type UserAlias struct {
	Id string `json:"id"`
}

type PasskeyCredential struct {
	ID string `json:"id"`
	// Is there any point in storing these?
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
	Icon        string `json:"icon,omitempty"`
	// is ID here different than ID in Credential?
	Credential webauthn.Credential `json:"credentials,omitempty"`
}

// Passkey credential must implement webauthn.User
var _ webauthn.User = (*PasskeyCredential)(nil)

type UserMore struct {
	Home      string
	User      *User
	LoginUcan string `json:"login_ucan,omitempty"`
}
