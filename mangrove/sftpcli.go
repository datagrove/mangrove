package mangrove

import (
	"fmt"
	"io"
	"io/ioutil"
	"os"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

type SshConnection struct {
	Host     string
	Port     int
	User     string
	Password string
	ssh.PublicKey
}

// at least once delivery.
type SftpFetch struct {
	SshConnection
	RemotePath string // glob
	LocalPath  string
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
func PutSftp(s *SftpFetch) error {
	client, e := Open(&s.SshConnection)
	if e != nil {
		return e
	}
	defer client.Close()
	// Create a file on the SFTP server
	remoteFile, err := client.Create("/path/to/remote/file")
	if err != nil {
		return err
	}
	defer remoteFile.Close()

	// Write some data to the SFTP server
	_, err = remoteFile.Write([]byte("Hello, world!"))
	if err != nil {
		return err
	}

	// Close the file
	err = remoteFile.Close()
	if err != nil {
		return err
	}

	return nil
}
func MirrorFromSftp(s *SftpFetch) error {
	client, e := Open(&s.SshConnection)
	if e != nil {
		return e
	}
	// Fetch a remote file
	remoteFile, err := client.Open("/path/to/remote/file")
	if err != nil {
		return err
	}
	defer remoteFile.Close()

	// Read the contents of the remote file
	remoteBytes, err := ioutil.ReadAll(remoteFile)
	if err != nil {
		return err
	}

	// Write the contents of the remote file to a local file
	err = ioutil.WriteFile("/path/to/local/file", remoteBytes, 0644)
	if err != nil {
		return err
	}

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

	return nil
}

// writeToSFTP writes a file to an SFTP server using an SFTP client.
func writeToSFTP(client *sftp.Client, remotePath string, localFile io.Reader) error {
	remoteFile, err := client.Create(remotePath)
	if err != nil {
		return fmt.Errorf("Failed to create remote file: %v", err)
	}
	defer remoteFile.Close()

	_, err = io.Copy(remoteFile, localFile)
	if err != nil {
		return fmt.Errorf("Failed to write to remote file: %v", err)
	}

	return nil
}
