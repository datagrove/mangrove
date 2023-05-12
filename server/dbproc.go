package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image/png"
	"log"
	"os"
	"path"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	sq "github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	"github.com/datagrove/mangrove/message"
	"github.com/datagrove/mangrove/ucan"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/goombaio/namegenerator"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

const (
	kPasskey  = 1
	kPasskeyp = 2
	kTotp     = 4
	kMobile   = 8
	kEmail    = 16
	kApp      = 32
	kVoice    = 64
	kNone     = 128
)

const (
	demo123 = "$2a$12$moAgCg/c0OUQyS67TktVJehoY71wxds3syPOvKwNNONfabXGwGyPG"
)

func (s *Server) CloseStream(fid int64) {
	s.muStream.Lock()
	defer s.muStream.Unlock()
	delete(s.Stream, fid)
}
func (s *Server) OpenStream(fid int64) (*Stream, error) {
	s.muStream.Lock()
	defer s.muStream.Unlock()
	if stream, ok := s.Stream[fid]; ok {
		return stream, nil
	}
	stream := &Stream{
		mu:     sync.Mutex{},
		fid:    fid,
		listen: map[*Session]int64{},
	}
	s.Stream[fid] = stream
	return stream, nil
}

func Dbproc(mg *Server) error {

	// add typesafe query apis
	// server / organization / database / table-or-$ / if $ then $/path
	mg.AddApi("open", true, func(r *Rpcp) (any, error) {
		var v OpenDb
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return mg.Open(r.Session, &v)
	})
	mg.AddApi("close", true, func(r *Rpcp) (any, error) {
		var v struct {
			Handle int64
		}
		sockUnmarshal(r.Params, &v)
		return true, mg.Close(r.Session, v.Handle)
	})

	mg.AddApi("commit", true, func(r *Rpcp) (any, error) {
		var v Transaction
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return true, mg.Commit(r.Session, &v)
	})
	mg.AddApi("read", true, func(r *Rpcp) (any, error) {
		var v ReadLog
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return mg.Read(r.Session, &v)
	})
	mg.AddApi("append", true, func(r *Rpcp) (any, error) {
		var v Append
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return true, mg.Append(r.Session, &v)
	})
	mg.AddApi("trim", true, func(r *Rpcp) (any, error) {
		var v Trim
		e := sockUnmarshal(r.Params, &v)
		if e != nil {
			return nil, e
		}
		return true, mg.Trim(r.Session, &v)
	})

	return nil
}

// two stage api because we might want to use things other than socket apis
type ReadLog struct {
	Handle int64
	From   int64
	To     int64
}

// api's already hold session locks?
func (s *Server) Read(sess *Session, read *ReadLog) (any, error) {
	// see if we have permission
	h, ok := sess.Handle[read.Handle]
	if !ok {
		return nil, fmt.Errorf("invalid handle")
	}
	a, e := s.Db.qu.Read(context.Background(), mangrove_sql.ReadParams{
		Fid:     h.Stream.fid,
		Start:   read.From,
		Start_2: read.To,
	})
	return a, e
}

type OpenDb struct {
	Auth      string `json:"auth"` // dg://server/organization/database/stream
	Starting  int64  // if starting is 0 or too old, return a snapshot.
	Subscribe bool
}

func pt(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: len(s) > 0}
}

// one solution is to give everyone a unique number
// they can only recover anyway if they have stored email or mobile
// but that effectively forces an email address, and not useful as screen name?
// modifies the name to be unique
// this would force the name to be unique, but the ux is awkward
// count, e := s.Db.qu.UpdatePrefix(context.Background(), user)
// if e != nil {
// 	e := s.Db.qu.InsertPrefix(context.Background(), user)
// 	if e != nil {
// 		return "", e
// 	}
// 	count = 0
// }

// if count > 0 {
// 	user = fmt.Sprintf("%s%d", user, count)
// }

// hash the password
//by, e := bcrypt.GenerateFromPassword([]byte(sess.Password), bcrypt.DefaultCost)
// if e != nil {
// 	return "", e
// }

func (s *Server) TotpSecret(user string) (string, error) {
	key, e := totp.Generate(totp.GenerateOpts{
		Issuer:      s.Name,
		AccountName: user,
	})
	if e != nil {
		return "", e
	}
	return key.URL(), nil
}

func (s *Server) TotpBytes(url string) ([]byte, error) {
	key, e := otp.NewKeyFromURL(url)
	if e != nil {
		return nil, e
	}
	// Convert TOTP key into a PNG
	var buf bytes.Buffer
	img, err := key.Image(200, 200)
	if err != nil {
		return nil, err
	}
	png.Encode(&buf, img)
	return buf.Bytes(), nil
}

// this is for the proxy to create a new user
// this is from http, how can we get the session, do we need it?
func (s *Server) CreateUser(user, pass, ph string) error {
	key, e := s.TotpSecret(user)
	if e != nil {
		return e
	}
	_, e = s.Db.qu.InsertOrg(context.Background(), mangrove_sql.InsertOrgParams{
		Name:     user,
		IsUser:   true,
		Password: []byte(pass),
		HashAlg:  pgtype.Text{String: "", Valid: true},
		Email:    pt(user),
		Mobile:   pt(ph),
		Pin:      "",
		Webauthn: "",
		Totp:     key,
		Flags:    0,
	})

	return e

}

func (s *Server) Register(sess *Session) (string, error) {
	user := sess.Username

	key, e := totp.Generate(totp.GenerateOpts{
		Issuer:      s.Name,
		AccountName: user,
	})
	if e != nil {
		return "", e
	}
	// Convert TOTP key into a PNG
	var buf bytes.Buffer
	img, err := key.Image(200, 200)
	if err != nil {
		panic(err)
	}
	png.Encode(&buf, img)

	oid, e := s.Db.qu.InsertOrg(context.Background(), mangrove_sql.InsertOrgParams{
		Name:     user,
		IsUser:   true,
		Password: []byte(sess.Password),
		HashAlg:  pgtype.Text{String: "", Valid: true},
		Email:    pt(sess.Email),
		Mobile:   pt(sess.Phone),
		Pin:      "",
		Webauthn: "",
		Totp:     key.Secret(),
		TotpPng:  buf.Bytes(),
		Flags:    0,
	})
	sess.Oid = oid
	sess.Name = user

	return user, e
}

// this can be 0, it can be kNone. In both cases we should send the loginInfo since we are already logged in.
var errBadLogin = fmt.Errorf("invalidLogin")

// pref should be a mask?
func (s *Server) PasswordLogin(sess *Session, user, password string, pref int) (*ChallengeNotify, error) {
	a, e := s.Db.qu.SelectOrgByName(context.Background(), user)
	if e != nil {
		// we can't find the user, but check to see if the proxy knows them
		//return nil, e
		sess.Username = user
		sess.Password = password
		li, e := s.GetLoginInfo(sess)
		if e != nil {
			return nil, e
		}

		// there is a lot of duplication of this code!

		// no bcrypt, we wouldn't be able to proxy, should be optional when not a proxy though
		// pass, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		// store the user locally
		key, e := s.TotpSecret(user)
		if e != nil {
			return nil, e
		}
		oid, e := s.Db.qu.InsertOrg(context.Background(), mangrove_sql.InsertOrgParams{
			Name:          user,
			IsUser:        true,
			Password:      []byte(password),
			HashAlg:       pt(""),
			Email:         pt(li.Email),
			Mobile:        pt(li.Phone),
			Pin:           "",
			Webauthn:      "",
			Totp:          key,
			Flags:         0,
			TotpPng:       []byte{},
			DefaultFactor: 0,
		})
		if e != nil {
			return nil, e
		}
		sess.Oid = oid

		return &ChallengeNotify{
			ChallengeType:   0,
			ChallengeSentTo: "",
			OtherOptions:    0,
			LoginInfo:       li,
		}, nil

	}

	switch a.HashAlg.String {
	case "bcrypt":
		e = bcrypt.CompareHashAndPassword([]byte(a.Password), []byte(password))
		if e != nil {
			return nil, errBadLogin
		}
	case "":
		if string(a.Password) != password {
			return nil, errBadLogin
		}
	}
	sess.Oid = a.Oid
	sess.Username = a.Name
	sess.Password = string(a.Password)

	sess.Name = a.Name
	sess.DisplayName = a.Name
	sess.Mobile = a.Mobile.String
	sess.Email = a.Email.String
	sess.Voice = a.Mobile.String
	sess.Totp = a.Totp
	sess.DefaultFactor = int(a.DefaultFactor)

	return s.SendChallenge(sess)
}

// always send LoginInfo.
func (s *Server) GetSettings(sess *Session) (*Settings, error) {
	a, e := s.Db.qu.SelectOrg(context.Background(), sess.Oid)
	if e != nil {
		return nil, e
	}
	png, e := s.TotpBytes(string(a.Totp))
	if e != nil {
		return nil, e
	}
	return &Settings{
		UserSecret:      "",
		Img:             png,
		Email:           a.Email.String,
		Phone:           a.Mobile.String,
		ActivatePasskey: true,
		ActivateTotp:    true,
	}, nil

}
func (s *Server) Configure(sess *Session, li *Settings) error {
	// this doesn't work, we need all the fields
	// s.Db.qu.UpdateOrg(context.Background(), mangrove_sql.UpdateOrgParams{
	// 	Oid:    sess.Oid,
	// 	Email:  pt(li.Email),
	// 	Mobile: pt(li.Phone),
	// })
	return nil
}

func (s *Server) GetPasswordFromEmail(email string) (string, error) {
	a, e := s.Db.qu.SelectOrgByName(context.Background(), email)
	if e != nil {
		return "", e
	}
	return string(a.Password), nil
}

// logging in always sends the ChallengeNotify, but we can also send it after logging in to confirm configuration changes.
// this should probably come from the database for scale reasons.
// this is a password equivalent so care needs to be taken
func (s *Server) GetLoginInfo(sess *Session) (*LoginInfo, error) {
	var li *LoginInfo
	var e error
	if s.ProxyLogin != nil {
		li, e = s.ProxyLogin(sess.Username, sess.Password)
		if e != nil {
			return nil, e
		}
	} else {
		li = &LoginInfo{
			Home:       "",
			Email:      "",
			Phone:      "",
			Cookies:    []string{},
			UserSecret: "",
			Options:    0,
		}
	}
	li.UserSecret, e = s.UserToSecret(sess.Oid)
	if e != nil {
		return nil, e
	}
	return li, nil
}
func (s *Server) RecoverPasswordResponse2(sess *Session, challenge, password string) error {
	if challenge != sess.Challenge {
		return errBadLogin
	}
	e := s.Db.qu.UpdatePassword(context.Background(), mangrove_sql.UpdatePasswordParams{
		Oid:      sess.Oid,
		Password: []byte(password),
	})
	if e != nil {
		return e
	}
	if s.ProxyUpdatePassword != nil {
		// we need to get the old password in order to authorize the password change
		//o, e := s.ProxyUpdatePassword(sess.Username, password)
	}
	sess.Password = password
	// we should should challenge both email and phone?
	// if they require a totp or webauthn, we still need that.
	// at this point they will redirect to the login page.
	return nil
}
func (s *Server) RecoverPasswordResponse(sess *Session, challenge string) bool {
	// They may have recovered their password here, but they may need to still provide a second factor.
	// we should probably get rid of the session variables and use encryption instead.
	// this would work better with serverless.
	// we could do this generally with the session, but we would want to minimize the session size

	return sess.Challenge == challenge
}
func (s *Server) RecoverPasswordChallenge(sess *Session, email, phone string) error {
	if len(email) > 0 {
		a, e := s.Db.qu.OrgByEmail(context.Background(), pt(email))
		if e != nil {
			return e
		}
		sess.Name = a.Name
		sess.DisplayName = a.Name
		sess.Mobile = a.Mobile.String
		sess.Email = a.Email.String
		sess.Voice = a.Mobile.String
		_ = a
		s.SendChallenge(sess)
	} else if len(phone) > 0 {
		a, e := s.Db.qu.OrgByPhone(context.Background(), pt(phone))
		if e != nil {
			return e
		}
		sess.Name = a.Name
		sess.DisplayName = a.Name
		sess.Mobile = a.Mobile.String
		sess.Email = a.Email.String
		sess.Voice = a.Mobile.String
		s.SendChallenge(sess)
	}

	return nil
}

// using the database here is not good
// we want to test the values before we store them
func (s *Server) SendChallenge(sess *Session) (*ChallengeNotify, error) {
	code, e := message.CreateCode()
	if e != nil {
		return nil, e
	}
	msg := fmt.Sprintf("The security code for %s is %s", s.Name, code)
	sess.Challenge = code

	var li *LoginInfo

	var to string
	switch sess.DefaultFactor {
	case kNone, 0:

		li, e = s.GetLoginInfo(sess)
		if e != nil {
			return nil, e
		}

	case kMobile:
		to = sess.Mobile
		e = message.Sms(to, msg)
	case kVoice:
		to = sess.Mobile
		e = message.Voice(to, msg)
	case kEmail:
		to = sess.Email
		subj := fmt.Sprintf("Security code for %s", s.Name)
		o := &message.Email{
			Sender:    s.EmailSource,
			Recipient: to,
			Subject:   subj,
			Html:      "",
			Text:      msg,
		}
		e = o.Send()
	case kTotp, kApp:
		// ?
	}
	if e != nil {
		log.Printf("error sending challenge: %s", e)
		return nil, e
	}

	cn := &ChallengeNotify{
		ChallengeType:   int(sess.DefaultFactor),
		ChallengeSentTo: to,
		OtherOptions:    0,
		LoginInfo:       li,
	}
	return cn, nil
}
func (mg *Server) ValidateChallenge(sess *Session, value string) bool {
	switch sess.DefaultFactor {
	case kMobile, kVoice, kEmail:
		return value == sess.Challenge
	case kTotp:
		key, e := otp.NewKeyFromURL(sess.Totp)
		if e != nil {
			log.Printf("error validating totp: %s", e)
			return false
		}
		return totp.Validate(value, key.Secret())
	}
	return false
}

// called from register2 with webauthn
// exclude credentials?
func (s *Server) StoreFactor(sess *Session, key int, value string, cred *webauthn.Credential) error {
	a, e := s.Db.qu.SelectOrg(context.Background(), sess.Oid)
	if e != nil {
		return e
	}
	if cred != nil {
		// serialize credentials
		if len(a.Webauthn) != 0 {
			json.Unmarshal([]byte(a.Webauthn), &sess.Device)
		}
		sess.UserDevice.Credentials = append(sess.UserDevice.Credentials, *cred)
		b, e := json.Marshal(&sess.UserDevice)
		if e != nil {
			return e
		}
		a.Webauthn = string(b)
	}

	a.DefaultFactor = int32(key)
	switch key {
	case kPasskey:
		a.Flags |= kPasskey
	case kPasskeyp:
		a.Flags |= kPasskeyp
	case kEmail:
		a.Email = pt(value)
	case kMobile:
		a.Mobile = pt(value)
		a.Flags |= kMobile
	case kTotp:
		// already stored, but sets the flag
		a.Flags |= kTotp
	case kApp:
		a.Flags |= kApp
	case kVoice:
		a.Mobile = pt(value)
		a.Flags |= kVoice
	}
	s.Db.qu.UpdateOrg(context.Background(), mangrove_sql.UpdateOrgParams{
		Oid:           a.Oid,
		Name:          a.Name,
		IsUser:        a.IsUser,
		Password:      a.Password,
		HashAlg:       a.HashAlg,
		Email:         a.Email,
		Mobile:        a.Mobile,
		Pin:           a.Pin,
		Webauthn:      a.Webauthn,
		Totp:          a.Totp,
		Flags:         a.Flags,
		TotpPng:       a.TotpPng,
		DefaultFactor: a.DefaultFactor,
	})

	s.Db.qu.InsertCredential(context.Background(), mangrove_sql.InsertCredentialParams{
		Oid: sess.Oid,
		Name: pgtype.Text{
			String: "",
			Valid:  false,
		},
		Type: pgtype.Text{
			String: "",
			Valid:  false,
		},
		Value: []byte{},
	})
	return nil
}
func (mg *Server) Open(sess *Session, w *OpenDb) (int64, error) {
	//ucan.Parse(w.Auth)
	return 0, nil
}

func (s *Server) Close(sess *Session, handle int64) error {
	stream, ok := sess.Handle[handle]
	if !ok {
		return nil
	}

	stream.mu.Lock()
	defer stream.mu.Unlock()
	delete(stream.listen, sess)
	if len(stream.listen) == 0 {
		s.CloseStream(stream.fid)
	}
	delete(sess.Handle, handle)
	return nil
}

var badHandle = fmt.Errorf("invalid handle")

// when packed into the log, we can map the Handles to Fid's
// but then why not use fid's to begin with?
type Transaction struct {
	Locks  []Lock
	Handle []int64
	Start  []int
	Fn     []*Functor
}

// key = server://org/db/table/...[primary key]/column/after
type Functor struct {
	Op    string // insert,  delete, update,
	Key   []any  // cbor byte[] for update the key needs to include the column, #after if vector
	Value []byte // argument to functor: f(old, value) -> new
}

// locks only advance. The lock succeeds if the proposed serial number is +1 from existing one.
// if any lock fails, the commit fails
// locks are meta data leaked to the server, so plan accordingly.
// locks are published in the stream
type Lock struct {
	Handle int64
	Name   []byte //
	Serial int64
}

func (mg *Server) Commit(sess *Session, tx *Transaction) error {
	b := context.Background()
	// see if we have permission
	for _, f := range tx.Handle {
		hx, ok := sess.Handle[f]
		if !ok || hx.flags&1 == 0 {
			return badHandle
		}
	}

	// see if we have locks; these have to take postgres locks
	for _, lock := range tx.Locks {
		_ = lock
	}

	// we can't really apply the functors, we just pack them into the main log
	// should we write open transactions to the log or substitute the path?
	tc, e := mg.Db.conn.Begin(b)
	if e != nil {
		return e
	}

	tc.Rollback(b)
	return tc.Commit(b)
}

type Append struct {
	Handle int64
	At     int64 `json:"at"`
	Root   bool
	Data   []byte `json:"data"`
}

// we can identify the snapshot with the device did of the client
func (mg *Server) Append(sess *Session, append *Append) error {
	x, ok := sess.Handle[append.Handle]
	if !ok || x.flags&2 == 0 {
		return badHandle
	}
	e := mg.Db.qu.Write(context.Background(), mangrove_sql.WriteParams{
		Fid:   x.Stream.fid,
		Start: append.At,
		Data:  append.Data,
	})

	return e
}

type Trim struct {
	Handle int64
	From   int64 `json:"from"`
	To     int64 `json:"to"`
}

func (mg *Server) Trim(sess *Session, trim *Trim) error {
	x, ok := sess.Handle[trim.Handle]
	if !ok || x.flags&2 == 0 {
		return badHandle
	}
	e := mg.Db.qu.Trim(context.Background(), mangrove_sql.TrimParams{
		Fid:     x.Stream.fid,
		Start:   trim.From,
		Start_2: trim.To,
	})
	return e
}

// urlExample := "postgres://mangrove:mangrove@localhost:5432/mangrove"
type Db struct {
	conn *pgxpool.Pool //*sql.DB
	qu   *sq.Queries
}

//	func NewDb(cn string) (*Db, error) {
//		godotenv.Load()
//		conn, err := sql.Open("postgres", cn)
//		if err != nil {
//			return nil, err
//		}
//		defer conn.Close()
//		qu := sq.New(conn)
//		return &Db{
//			conn: conn,
//			qu:   qu,
//		}, nil
//	}
func NewDb(cn string) (*Db, error) {
	godotenv.Load()
	conn, err := pgxpool.New(context.Background(), cn)
	if err != nil {
		return nil, err
	}
	qu := sq.New(conn)
	return &Db{
		conn: conn,
		qu:   qu,
	}, nil
}
func (s *Db) Close() {
	s.conn.Close()
}

func (s *Server) AvailableUserName(name string) (int64, error) {
	// d := path.Join(s.Home, "user", name, ".config.json")
	// _, e := os.Stat(d)
	s.Db.qu.InsertPrefix(context.Background(), name)
	return s.Db.qu.UpdatePrefix(context.Background(), name)
}
func (s *Server) SuggestName(name string) (string, error) {
	if len(name) == 0 {
		seed := time.Now().UTC().UnixNano()
		nameGenerator := namegenerator.NewNameGenerator(seed)
		name = nameGenerator.Generate()
	}
	a, e := s.AvailableUserName(name)
	if e != nil {
		return "", e
	}
	if a == 1 {
		return name, nil
	} else {
		return fmt.Sprintf("%s%d", name, a), nil
	}
}
func (s *Server) SaveUser(u *UserDevice) error {
	name := strings.ReplaceAll(u.ID, ":", "_")
	b, e := json.MarshalIndent(u, "", " ")
	if e != nil {
		return e
	}
	d := path.Join(s.Home, "user", name, ".config.json")
	os.MkdirAll(path.Dir(d), 0700)
	return os.WriteFile(d, b, 0600)

}

func (s *Server) checkCanLogin(device, cred string) error {
	// device is a did. cred must be a valid ucan with audience of device,and login capability
	ucan, e := ucan.DecodeUcan(cred)
	if e != nil {
		return e
	}
	_ = ucan
	return nil
}

func (s *Server) OkName(sess *Session, name string) bool {
	a, _ := s.Db.qu.AvailableName(context.Background(), name)
	return a == 0
}
func (s *Server) NewDevice(u *UserDevice) error {
	b := context.Background()

	webauth, e := json.Marshal(u)
	if e != nil {
		return e
	}
	return s.qu.InsertDevice(b, sq.InsertDeviceParams{
		Device:   0, //u.ID,
		Webauthn: string(webauth),
	})
}
func (s *Server) LoadWebauthnUser(sess *Session, id string) error {
	idn, e := strconv.ParseInt(id, 10, 64)
	if e != nil {
		return e
	}
	a, e := s.Db.qu.SelectOrg(context.Background(), idn)
	sess.Oid = a.Oid
	sess.Username = a.Name
	sess.Password = string(a.Password)
	if e != nil {
		return e
	}
	return json.Unmarshal([]byte(a.Webauthn), &sess.UserDevice)
}
func (s *Server) LoadDevice(u *UserDevice, device string) error {
	u.ID = device
	a, e := s.Db.qu.GetDevice(context.Background(), 0) //device)
	if e != nil {
		return e
	}
	return json.Unmarshal([]byte(a.Webauthn), u)
}

// Save device is for adding a credential to an existing device
// maybe a credential should be a device? Could look like things disappeared though.
func (s *Server) UpdateDevice(u *UserDevice) error {
	b, e := json.MarshalIndent(u, "", " ")
	if e != nil {
		return e
	}
	s.qu.DeleteDevice(context.Background(), 0) //u.ID)
	return s.qu.InsertDevice(context.Background(), sq.InsertDeviceParams{
		Device:   0, // "",
		Webauthn: string(b),
	})
}

// name = strings.ReplaceAll(name, ":", "_")
// b, e := os.ReadFile(path.Join(s.Home, "user", name, ".config.json"))
// if e != nil {
// 	return e
// }
// return json.Unmarshal(b, u)
// name := strings.ReplaceAll(u.ID, ":", "_")
// d := path.Join(s.Home, "user", name, ".config.json")
// os.MkdirAll(path.Dir(d), 0700)
// return os.WriteFile(d, b, 0600)
