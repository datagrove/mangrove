package mangrove

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path"
	"strings"
	"time"

	sq "github.com/datagrove/mangrove/mangrove_sql/mangrove_sql"
	ucan "github.com/datagrove/mangrove/ucan"
	"github.com/goombaio/namegenerator"
	_ "github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

// urlExample := "postgres://mangrove:mangrove@localhost:5432/mangrove"
type Db struct {
	conn *sql.DB
	qu   *sq.Queries
}

func NewDb(cn string) (*Db, error) {
	godotenv.Load()
	conn, err := sql.Open("postgres", cn)
	if err != nil {
		return nil, err
	}
	defer conn.Close()
	qu := sq.New(conn)
	return &Db{
		conn: conn,
		qu:   qu,
	}, nil
}

func (d *Db) GetCredential(id string) (*sq.Credential, error) {
	a, e := d.qu.GetCredential(context.Background(), id)
	if e != nil {
		fmt.Println(e)
	}

}

func (s *Server) IsAvailableUsername(name string) bool {
	d := path.Join(s.Home, "user", name, ".config.json")
	_, e := os.Stat(d)
	return e != nil
}
func (s *Server) SuggestName(name string) string {
	for {
		if len(name) == 0 {
			seed := time.Now().UTC().UnixNano()
			nameGenerator := namegenerator.NewNameGenerator(seed)
			name = nameGenerator.Generate()
		}

		for i := 0; i < 1000; i++ {
			sname := name
			if i != 0 {
				sname = fmt.Sprintf("%s%d", name, i)
			}
			d := path.Join(s.Home, "user", sname, ".config.json")
			_, e := os.Stat(d)
			_ = e
			return sname
		}
		name = ""
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
func (s *Server) LoadUser(name string, u *UserDevice) error {
	// name = strings.ReplaceAll(name, ":", "_")
	// b, e := os.ReadFile(path.Join(s.Home, "user", name, ".config.json"))
	// if e != nil {
	// 	return e
	// }
	// return json.Unmarshal(b, u)
	return nil
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

func (s *Server) SaveDevice(u *UserDevice) error {
	b, e := json.MarshalIndent(u, "", " ")
	if e != nil {
		return e
	}
	s.qu.DeleteDevice(context.Background(), u.ID)
	return s.qu.InsertDevice(context.Background(), sq.InsertDeviceParams{
		Device:   "",
		Webauthn: string(b),
	})
	// name := strings.ReplaceAll(u.ID, ":", "_")
	// d := path.Join(s.Home, "user", name, ".config.json")
	// os.MkdirAll(path.Dir(d), 0700)
	// return os.WriteFile(d, b, 0600)

}
func (s *Server) NewDevice(u *UserDevice) (string, error) {
	name := s.SuggestName("")
	return name, nil
}
func (s *Server) LoadDevice(u *UserDevice, device string) error {
	a, e := s.Db.qu.GetDevice(context.Background(), device)
	if e != nil {
		return e
	}
	return json.Unmarshal([]byte(a.Webauthn), u)
}

// name = strings.ReplaceAll(name, ":", "_")
// b, e := os.ReadFile(path.Join(s.Home, "user", name, ".config.json"))
// if e != nil {
// 	return e
// }
// return json.Unmarshal(b, u)
