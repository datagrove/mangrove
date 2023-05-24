package main

import (
	"bufio"
	"fmt"
	"io/fs"
	"io/ioutil"
	"log"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

type FolderSpec struct {
	*SftpCred
	Root string
}

func (s *FolderSpec) IsLocal() bool { return s.SftpCred == nil }

// by design does not support password
func NewSpec(s string, port int, password string) (*FolderSpec, error) {
	sp := strings.Split(s, ":")
	var host string
	if len(sp) == 1 {
		// local
		return &FolderSpec{Root: sp[0]}, nil
	} else {
		sp2 := strings.Split(sp[0], "@")
		host = sp2[1]
		return &FolderSpec{
			Root: sp[1],
			SftpCred: &SftpCred{
				Host:     host,
				User:     sp2[0],
				Port:     port,
				Password: password,
			},
		}, nil
	}

}
func SftpCopy(source, target string, port int, password string) error {
	a, e := NewSpec(source, port, password)
	if e != nil {
		return e
	}

	b, e := NewSpec(target, port, password)
	if e != nil {
		return e
	}
	if a.IsLocal() {
		cl, e := NewSftpClient(b.SftpCred)
		if e != nil {
			return e
		}
		fsys := os.DirFS(a.Root)
		fs.WalkDir(fsys, "/", func(p string, d fs.DirEntry, e error) error {
			if d.IsDir() {
				cl.MkdirAll(path.Join(b.Root, p), 0666)
				return nil
			}
			by, e := os.ReadFile(path.Join(a.Root, p))
			if e != nil {
				return e
			}
			return cl.WriteFile(path.Join(b.Root, p), by, 0666)
		})

	} else {
		cl, e := NewSftpClient(a.SftpCred)
		if e != nil {
			return e
		}
		fs.WalkDir(&cl, a.Root, func(p string, d fs.DirEntry, e error) error {
			if d.IsDir() {
				os.MkdirAll(path.Join(b.Root, p), 0666)
			}
			by, e := cl.ReadFile(path.Join(a.Root, p))
			return cl.WriteFile(path.Join(b.Root, p), by, 0666)
		})

	}

	return nil
}

type SftpCred struct {
	Host     string
	Port     int
	User     string
	Password string
}
type SftpClient struct {
	client *sftp.Client
}
type sftpFS = SftpClient

var _ fs.FS = (*SftpClient)(nil)

func getHostKey(host string) ssh.PublicKey {
	// parse OpenSSH known_hosts file
	// ssh or use ssh-keyscan to get initial key
	file, err := os.Open(filepath.Join(os.Getenv("HOME"), ".ssh", "known_hosts"))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to read known_hosts file: %v\n", err)
		os.Exit(1)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var hostKey ssh.PublicKey
	for scanner.Scan() {
		fields := strings.Split(scanner.Text(), " ")
		if len(fields) != 3 {
			continue
		}
		if strings.Contains(fields[0], host) {
			var err error
			hostKey, _, _, _, err = ssh.ParseAuthorizedKey(scanner.Bytes())
			if err != nil {
				fmt.Fprintf(os.Stderr, "Error parsing %q: %v\n", fields[2], err)
				os.Exit(1)
			}
			break
		}
	}

	if hostKey == nil {
		fmt.Fprintf(os.Stderr, "No hostkey found for %s", host)
		os.Exit(1)
	}

	return hostKey
}

func readPublicKey(keypath string) ([]ssh.AuthMethod, error) {
	pKeyBytes, err := ioutil.ReadFile(keypath)
	if err != nil {
		return nil, err
	}
	signer, err := ssh.ParsePrivateKey(pKeyBytes)
	if err != nil {
		return nil, err
	}
	return []ssh.AuthMethod{
		ssh.PublicKeys(signer),
	}, nil
}
func (s *SftpClient) Close() error {
	return s.client.Close()
}

func NewSftpClient(opt *SftpCred) (SftpClient, error) {
	var auths []ssh.AuthMethod

	userdir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal(err)
	}
	keypath := path.Join(userdir, ".ssh", "id_rsa")
	authMethod, e := readPublicKey(keypath)
	if e == nil {
		auths = append(auths, authMethod...)
	}

	if opt.Port == 0 {
		opt.Port = 22
	}
	hostKey := getHostKey(opt.Host)
	if opt.Password != "" {
		auths = append(auths, ssh.Password(opt.Password))
	}
	config := ssh.ClientConfig{
		User: opt.User,
		Auth: auths,
		// Uncomment to ignore host key check
		//HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		HostKeyCallback: ssh.FixedHostKey(hostKey),
	}
	// Connect to server
	addr := fmt.Sprintf("%s:%d", opt.Host, opt.Port)
	conn, err := ssh.Dial("tcp", addr, &config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to connecto to [%s]: %v\n", addr, err)
		os.Exit(1)
	}

	defer conn.Close()

	// Create new SFTP client
	sc, err := sftp.NewClient(conn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to start SFTP subsystem: %v\n", err)
		os.Exit(1)
	}
	return SftpClient{client: sc}, nil
}

// can we create fs from local file system?
func OsUpload(path string) {
	fsys := os.DirFS(path)
	Upload(fsys, "/")
}
func Upload(a fs.FS, d string) {
	fs.WalkDir(a, d, func(p string, de fs.DirEntry, e error) error {
		f, e := fs.ReadFile(a, p)
		if e != nil {
			return e
		}
		os.WriteFile(path.Join(d, p), f, 0600)
		return nil
	})
}

func NewSFTPFS(client *sftp.Client) (*sftpFS, error) {
	return &sftpFS{client: client}, nil
}

func (fs *sftpFS) Open(name string) (fs.File, error) {
	return fs.client.Open(name)
}

func (fs *sftpFS) Stat(name string) (fs.FileInfo, error) {
	return fs.client.Stat(name)
}

type sftpDirEntry struct {
	os.FileInfo
}

func (e sftpDirEntry) Type() fs.FileMode {
	if e.IsDir() {
		return fs.ModeDir
	}
	return fs.ModeType
}
func (s sftpDirEntry) Info() (fs.FileInfo, error) {
	return s.FileInfo, nil
}
func (fsx *sftpFS) ReadDir(name string) ([]fs.DirEntry, error) {
	dirEntries, err := fsx.client.ReadDir(name)
	if err != nil {
		return nil, err
	}

	entries := make([]fs.DirEntry, len(dirEntries))
	for i, entry := range dirEntries {
		entries[i] = sftpDirEntry{entry}
	}

	return entries, nil
}

func (fs *sftpFS) Chmod(name string, mode fs.FileMode) error {
	return fs.client.Chmod(name, os.FileMode(mode))
}

func (fs *sftpFS) Chtimes(name string, atime time.Time, mtime time.Time) error {
	return fs.client.Chtimes(name, atime, mtime)
}

func (fs *sftpFS) Mkdir(name string, perm fs.FileMode) error {
	return fs.client.Mkdir(name)
}

func (fs *sftpFS) MkdirAll(path string, perm fs.FileMode) error {
	return fs.client.MkdirAll(path)
}

func (fs *sftpFS) Remove(name string) error {
	return fs.client.Remove(name)
}

func (fs *sftpFS) Rename(oldname, newname string) error {
	return fs.client.Rename(oldname, newname)
}

func (fs *sftpFS) ReadFile(name string) ([]byte, error) {
	file, err := fs.client.Open(name)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	return ioutil.ReadAll(file)
}

func (fs *sftpFS) WriteFile(name string, data []byte, perm fs.FileMode) error {
	file, err := fs.client.Create(name)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(data)
	return err
}

func foo() {
	// Replace with your own SSH server details
	config := &ssh.ClientConfig{
		User:            "username",
		Auth:            []ssh.AuthMethod{ssh.Password("password")},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	// Replace with your own SSH server address
	conn, err := ssh.Dial("tcp", "localhost:22", config)
	if err != nil {
		log.Fatal(err)
	}

	client, err := sftp.NewClient(conn)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	fs, err := NewSFTPFS(client)
	if err != nil {
		log.Fatal(err)
	}

	// Example usage
	file, err := fs.Open("/path/to/file.txt")
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	data, err := ioutil.ReadAll(file)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(string(data))
}
