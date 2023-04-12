package mangrove

import (
	"fmt"
	"io/ioutil"
	"os"
	"path"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

type SshConnection struct {
	Host     string `json:"host,omitempty"`
	Port     int    `json:"port,omitempty"`
	User     string `json:"user,omitempty"`
	Password string `json:"password,omitempty"`
	ssh.PublicKey
	Gpg string `json:"gpg,omitempty"`
}

type DeliverFile struct {
	RemotePath string
	LocalPath  string
}
type SftpPut struct {
	SshConnection,
	Files []DeliverFile
}

//matches, err := filepath.Glob(pattern)

// we want to do this as a transaction
// we need to write all the files with temp names, then log the names, then do something on the server, potentially delete them.
// we need to hash the files as another way to reject duplicates.

// mirror to Sftp
func Open(s *SshConnection) (*sftp.Client, error) {
	conn, err := ssh.Dial("tcp", fmt.Sprintf("%s:%d", s.Host, s.Port), &ssh.ClientConfig{
		User: s.User,
		Auth: []ssh.AuthMethod{
			ssh.Password(s.Password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	})
	if err != nil {
		return nil, err
	}
	client, err := sftp.NewClient(conn)
	if err != nil {
		return nil, err
	}
	return client, nil
}

//	func Glob(client *sftp.Client, pattern string) (string[],error {
//		client.ReadDir(pattern)
//		return nil
//	}
func PutFiles(ctx *Context, cn *SshConnection, fromdir string, todir string) error {
	client, e := Open(cn)
	if e != nil {
		return e
	}
	defer client.Close()
	// Create a file on the SFTP server
	fs, e := os.ReadDir(fromdir)
	if e != nil {
		return e
	}
	for _, f := range fs {
		if f.IsDir() {
			continue
		}
		remoteFile, err := client.Create(path.Join(todir, f.Name()))
		if err != nil {
			return err
		}
		defer remoteFile.Close()

		b, e := os.ReadFile(path.Join(fromdir, f.Name()))
		if e != nil {
			return e
		}
		_, err = remoteFile.Write(b)
		if err != nil {
			return err
		}
	}

	return nil
}
func ArchiveFiles(dir string) error {
	fs, e := os.ReadDir(dir)
	if e != nil {
		return e
	}
	for _, f := range fs {
		e := os.Rename(f.Name(), path.Join(dir, "old", f.Name()))
		if e != nil {
			return e
		}
	}
	return nil

}
func EncryptFiles(ctx *Context, dir, to string, key []string) error {
	f, e := os.ReadDir(dir)
	if e != nil {
		return e
	}
	for _, f := range f {
		if f.IsDir() {
			continue
		}
		fp := path.Join(dir, f.Name())
		old := path.Join(dir, "old", f.Name())
		os.Rename(fp, old)
		e := Encrypt(old, path.Join(to, f.Name()+".pgp"), key)
		if e != nil {
			return e
		}
	}
	return nil
}
func DecryptFiles(ctx *Context, dir, to string) error {
	f, e := os.ReadDir(dir)
	if e != nil {
		return e
	}
	for _, f := range f {
		if f.IsDir() {
			continue
		}
		plain := path.Join(dir, f.Name())
		cipher := path.Join(dir, "old", f.Name())
		os.Rename(plain, cipher)
		tofile := path.Join(to, f.Name())
		if path.Ext(tofile) == ".pgp" {
			tofile = tofile[:len(tofile)-4]
		}
		e := Decrypt(cipher, tofile, ctx.Container.Gpg)
		if e != nil {
			return e
		}
	}
	return nil
}
func GetFiles(ctx *Context, s *SshConnection, todir string, frompattern string) error {
	client, e := Open(s)
	if e != nil {
		return e
	}

	getFile := func(in, out string) error {

		// Fetch a remote file
		remoteFile, err := client.Open(in)
		if err != nil {
			return err
		}
		// Read the contents of the remote file
		remoteBytes, err := ioutil.ReadAll(remoteFile)
		remoteFile.Close()
		if err != nil {
			return err
		}
		// Write the contents of the remote file to a local file
		err = ioutil.WriteFile(out, remoteBytes, 0644)
		if err != nil {
			return err
		}
		if err != nil {
			return err
		}
		// delete this file if it's a duplicate, otherwise leave a hash of it to prevent future duplicates.
		client.Remove(in)
		return nil
	}
	defer client.Close()
	fx, e := client.Glob(frompattern)
	//fx, e := client.ReadDir(fromdir)
	if e != nil {
		return e
	}
	for _, f := range fx {
		e := getFile(f, path.Join(todir, path.Base(f)))
		if e != nil {
			return e
		}
	}

	return nil
}

/*
	// Write a file to the SFTP server
	localFile, err := os.Open("/path/to/local/file")
	if err != nil {
		fmt.Printf("Failed to open local file: %v\n", err)
		os.Exit(1)
	}
	defer localFile.Close()

	err = writeToSFTP(client, "/path/to/remote/newfile", localFile)
	if err != nil {
		fmt.Printf("Failed to write file to SFTP server: %v\n", err)
		os.Exit(1)
	}

*/
// writeToSFTP writes a file to an SFTP server using an SFTP client.
// func writeToSFTP(client *sftp.Client, remotePath string, localFile io.Reader) error {
// 	remoteFile, err := client.Create(remotePath)
// 	if err != nil {
// 		return fmt.Errorf("Failed to create remote file: %v", err)
// 	}
// 	defer remoteFile.Close()

// 	_, err = io.Copy(remoteFile, localFile)
// 	if err != nil {
// 		return fmt.Errorf("Failed to write to remote file: %v", err)
// 	}

// 	return nil
// }
