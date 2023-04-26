package mangrove

import (
	"context"
	//"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path"
	"strings"
	"time"

	sq "github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	ucan "github.com/datagrove/mangrove/ucan"
	"github.com/goombaio/namegenerator"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

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

func (s *Server) NewDevice(u *UserDevice) error {
	b := context.Background()

	webauth, e := json.Marshal(u)
	if e != nil {
		return e
	}
	return s.qu.InsertDevice(b, sq.InsertDeviceParams{
		Device:   u.ID,
		Webauthn: string(webauth),
	})
}
func (s *Server) LoadDevice(u *UserDevice, device string) error {
	u.ID = device
	a, e := s.Db.qu.GetDevice(context.Background(), device)
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
	s.qu.DeleteDevice(context.Background(), u.ID)
	return s.qu.InsertDevice(context.Background(), sq.InsertDeviceParams{
		Device:   "",
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
