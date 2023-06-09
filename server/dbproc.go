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
	"strings"
	"time"

	"github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	sq "github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	"github.com/datagrove/mangrove/message"
	"github.com/datagrove/mangrove/ucan"
	"github.com/fxamacker/cbor/v2"
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

type Credential struct {
	Totp          []byte
	PasswordHash  []byte
	PasswordClear string //optional use for proxy.
	Phone         string
	Email         string
}

// this is for the proxy to create a new user
// this is from http, how can we get the session, do we need it?
func (s *Server) CreateUser(user, pass, ph string) error {

	n, e := s.Db.qu.InsertOrg(context.Background(), mangrove_sql.InsertOrgParams{
		Did:    pt(""),
		Name:   user,
		Notify: []byte{},
	})
	if e != nil {
		return e
	}

	return s.AddPasswordCredential(n, user, pass, ph, "")

}

func (s *Server) AddCredential1(sess *Session) (int64, error) {

	return 0, nil // s.Db.qu.GetCredentialNumber()
}
func (s *Server) AddCredential2(sess *Session, cred *webauthn.Credential) error {
	// if cred != nil {
	// 	// serialize credentials
	// 	sess.UserDevice.Credentials = append(sess.UserDevice.Credentials, *cred)
	// 	b, e := json.Marshal(&sess.UserDevice)
	// 	if e != nil {
	// 		return e
	// 	}
	// 	a.Webauthn = string(b)
	// }
	// return s.Db.qu.InsertCredential(context.Background(), mangrove_sql.InsertCredentialParams{
	// 	Oid:   sess.CredentialId,
	// 	Name:  pgtype.Text{},
	// 	Type:  pgtype.Text{},
	// 	Value: []byte{},
	// })
	panic("not implemented")
}
func (s *Server) RegisterEmailSocial(sess *Session, email, social string) error {
	// insert an org record. fail if email exists since that would get confusing.
	return nil
}
func (s *Server) RegisterEmailPassword(sess *Session, email, password string) error {
	// insert an org record. fail if email exists since that would get confusing.
	return nil
}

// registers with a passkey only
func (s *Server) RegisterPasskey(sess *Session) error {
	n, e := s.Db.qu.InsertOrg(context.Background(), mangrove_sql.InsertOrgParams{
		Did:    pt(""),
		Name:   sess.Name,
		Notify: []byte{},
	})
	if e != nil {
		return e
	}
	// should be cbor?
	b, e := json.Marshal(&sess.PasskeyCredential)
	if e != nil {
		return e
	}
	return s.Db.qu.InsertCredential(context.Background(), mangrove_sql.InsertCredentialParams{
		Cid:   []byte("p:" + sess.ID),
		Oid:   n,
		Name:  pgtype.Text{},
		Value: b,
	})

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
		Did:    pgtype.Text{},
		Name:   user,
		Notify: []byte{},
	})
	sess.Oid = oid
	sess.Name = user

	return user, e
}

// this can be 0, it can be kNone. In both cases we should send the loginInfo since we are already logged in.
var errBadLogin = fmt.Errorf("invalidLogin")

func (s *Server) AddPasswordCredential(oid int64, user, password, ph, email string) error {
	pass, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	password = "" // add option to keep

	// generate a totp credential
	key, e := s.TotpSecret(user)
	if e != nil {
		return e
	}
	cred := &Credential{
		Totp:          []byte(key),
		PasswordHash:  pass,
		PasswordClear: password,
		Phone:         ph,
		Email:         "",
	}
	b, e := cbor.Marshal(cred)
	// to use a totp we need a user name, so the cid is
	// totp:username
	// the secret is in the value.
	e = s.Db.qu.InsertCredential(context.Background(), mangrove_sql.InsertCredentialParams{
		Cid:   []byte(fmt.Sprintf("mfa:%s", user)),
		Oid:   0,
		Name:  pgtype.Text{},
		Value: b,
	})
	return e
	return nil
}

func (s *Server) ProxyLogin1(sess *Session, user, password string, pref int) (*ChallengeNotify, error) {
	// we can't find the user, but check to see if the proxy knows them
	//return nil, e
	sess.Username = user
	sess.Password = password
	li, e := s.GetLoginInfo(sess)
	if e != nil {
		return nil, e
	}

	// there is a lot of duplication of this code!

	oid, e := s.Db.qu.InsertOrg(context.Background(), mangrove_sql.InsertOrgParams{
		Oid:    0,
		Did:    pgtype.Text{},
		Name:   user,
		Notify: []byte{},
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

// pref should be a mask?
func (s *Server) PasswordLogin(sess *Session, user, password string, pref int) (*ChallengeNotify, error) {
	cid := []byte(fmt.Sprintf("mfa:%s", user))
	a, e := s.Db.qu.SelectCredential(context.Background(), cid)
	if e != nil && s.ProxyLogin != nil {
		return s.ProxyLogin1(sess, user, password, pref)
	}
	var cred Credential
	cbor.Unmarshal(a.Value, &cred)

	e = bcrypt.CompareHashAndPassword(cred.PasswordHash, []byte(password))
	if e != nil {
		return nil, errBadLogin
	}

	return s.SendChallenge(sess, &cred)
}

// always send LoginInfo.
func (s *Server) GetSettings(sess *Session) (*Settings, error) {
	a, e := s.Db.qu.SelectCredentialByOid(context.Background(), sess.Oid)
	if e != nil {
		return nil, e
	}
	x := []Credential{}
	totp := []byte{}
	for _, v := range a {
		var cred Credential
		cbor.Unmarshal(v.Value, &cred)
		if len(cred.Totp) > 0 {
			totp = cred.Totp
		}
		x = append(x, cred)
	}

	png, e := s.TotpBytes(string(totp))
	if e != nil {
		return nil, e
	}
	return &Settings{
		UserSecret: "",
		Img:        png,
		Credential: x,
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

// func (s *Server) GetPasswordFromEmail(email string) (string, error) {
// 	a, e := s.Db.qu.SelectOrgByName(context.Background(), email)
// 	if e != nil {
// 		return "", e
// 	}
// 	return string(a.Password), nil
// }

// call this based on successfully finding the oid in a passkey record
func (s *Server) LoginInfoFromOid(sess *Session, oid int64) (*LoginInfo, error) {
	a, e := s.Db.qu.SelectOrg(context.Background(), sess.Oid)
	if e != nil {
		return nil, e
	}
	_ = a
	// if s.ProxyLogin != nil {
	// 	// why do we know these things here? shouldn't they be parameters
	// 	// these things are meaningless if there is no proxy
	// 	li, e := s.ProxyLogin(a.Name, string(a.Password))
	// 	if e != nil {
	// 		return nil, e
	// 	}
	// 	li.UserSecret, e = s.UserToSecret(sess.Oid)
	// 	if e != nil {
	// 		return nil, e
	// 	}
	// 	return li, nil
	// }

	return &LoginInfo{
		Home:            "../home",
		Cookies:         []string{},
		UserSecret:      "",
		Options:         0,
		ActivatePasskey: true,
		ActivateTotp:    true,
	}, nil
}

// logging in always sends the ChallengeNotify, but we can also send it after logging in to confirm configuration changes.
// this should probably come from the database for scale reasons.
// this is a password equivalent so care needs to be taken
func (s *Server) GetLoginInfo(sess *Session) (*LoginInfo, error) {
	var li *LoginInfo
	var e error
	if s.ProxyLogin != nil {
		// why do we know these things here? shouldn't they be parameters
		// these things are meaningless if there is no proxy
		li, e = s.ProxyLogin(sess.Username, sess.Password)
		if e != nil {
			return nil, e
		}
	} else {
		li = &LoginInfo{
			Home:            "",
			Email:           "",
			Phone:           "",
			Cookies:         []string{},
			UserSecret:      "",
			Options:         0,
			ActivatePasskey: false,
			ActivateTotp:    false,
		}
	}
	li.UserSecret, e = s.UserToSecret(sess.Oid)
	if e != nil {
		return nil, e
	}
	return li, nil
}
func (s *Server) GetCredential(sess *Session, cid string) (*Credential, error) {
	a, e := s.Db.qu.SelectCredential(context.Background(), []byte(cid))
	if e != nil {
		return nil, e
	}
	var cred Credential
	cbor.Unmarshal(a.Value, &cred)
	return &cred, nil
}
func (s *Server) RecoverPasswordResponse(sess *Session, challenge, password string) error {
	if challenge != sess.Challenge {
		return errBadLogin
	}
	// read, modify, write a new credential
	cred, e := s.GetCredential(sess, sess.Cid)
	if e != nil {
		return e
	}
	cred.PasswordHash, e = bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if e != nil {
		return e
	}
	b, e := cbor.Marshal(cred)
	// we need to update the credential
	e = s.Db.qu.UpdateCredential(context.Background(), mangrove_sql.UpdateCredentialParams{
		Cid:   []byte(sess.Cid),
		Value: b,
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

// recover with phone or email
func (s *Server) RecoverPasswordChallenge(sess *Session, email, phone string) error {
	var cred *Credential

	var e error
	if len(email) > 0 {
		sess.Cid = "email:" + email
		cred, e = s.GetCredential(sess, "email:"+email)
		if e != nil {
			return e
		}

	} else if len(phone) > 0 {
		sess.Cid = "phone:" + phone
		cred, e = s.GetCredential(sess, "phone:"+phone)
		if e != nil {
			return e
		}
	}
	_, e = s.SendChallenge(sess, cred)
	return nil
}

// using the database here is not good
// we want to test the values before we store them
func (s *Server) SendChallenge(sess *Session, cred *Credential) (*ChallengeNotify, error) {
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
// exclude credentials? advantage of uuid's for credential ids? it's immediately distributed
func (s *Server) StoreFactor(sess *Session, key int, value string, cred *webauthn.Credential) error {
	a, e := s.Db.qu.SelectOrg(context.Background(), sess.Oid)
	if e != nil {
		return e
	}

	sess.PasskeyCredential.Credential = *cred
	_, e = json.Marshal(&sess.PasskeyCredential)
	if e != nil {
		return e
	}
	//a.Webauthn = string(b)

	// a.DefaultFactor = int32(key)
	// switch key {
	// case kPasskey:
	// 	a.Flags |= kPasskey
	// case kPasskeyp:
	// 	a.Flags |= kPasskeyp
	// case kEmail:
	// 	a.Email = pt(value)
	// case kMobile:
	// 	a.Mobile = pt(value)
	// 	a.Flags |= kMobile
	// case kTotp:
	// 	// already stored, but sets the flag
	// 	a.Flags |= kTotp
	// case kApp:
	// 	a.Flags |= kApp
	// case kVoice:
	// 	a.Mobile = pt(value)
	// 	a.Flags |= kVoice
	// }
	s.Db.qu.UpdateOrg(context.Background(), mangrove_sql.UpdateOrgParams{
		Oid:    a.Oid,
		Did:    pgtype.Text{},
		Name:   a.Name,
		Notify: []byte{},
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
		//s.CloseStream(stream.fid)
	}
	delete(sess.Handle, handle)
	return nil
}

var badHandle = fmt.Errorf("invalid handle")

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
func (s *Server) SaveUser(u *PasskeyCredential) error {
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
func (s *Server) NewDevice(u *PasskeyCredential) error {
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

	a, e := s.Db.qu.SelectCredential(context.Background(), []byte("p:"+id))
	sess.Oid = a.Oid
	if e != nil {
		return e
	}
	return json.Unmarshal([]byte(a.Value), &sess.PasskeyCredential)
}
func (s *Server) LoadDevice(u *PasskeyCredential, device string) error {
	u.ID = device
	a, e := s.Db.qu.GetDevice(context.Background(), 0) //device)
	if e != nil {
		return e
	}
	return json.Unmarshal([]byte(a.Webauthn), u)
}

// Save device is for adding a credential to an existing device
// maybe a credential should be a device? Could look like things disappeared though.
func (s *Server) UpdateDevice(u *PasskeyCredential) error {
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
