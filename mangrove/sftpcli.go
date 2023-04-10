package mangrove

import (
	"fmt"
	"io"
	"io/ioutil"
	"os"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

func mirror() {
	// Define the SFTP connection parameters
	config := &ssh.ClientConfig{
		User: "username",
		Auth: []ssh.AuthMethod{
			ssh.Password("password"),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	host := "example.com"
	port := 22

	// Connect to the SFTP server
	conn, err := ssh.Dial("tcp", fmt.Sprintf("%s:%d", host, port), config)
	if err != nil {
		fmt.Printf("Failed to connect to SFTP server: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close()

	// Create an SFTP client
	client, err := sftp.NewClient(conn)
	if err != nil {
		fmt.Printf("Failed to create SFTP client: %v\n", err)
		os.Exit(1)
	}
	defer client.Close()

	// Fetch a remote file
	remoteFile, err := client.Open("/path/to/remote/file")
	if err != nil {
		fmt.Printf("Failed to open remote file: %v\n", err)
		os.Exit(1)
	}
	defer remoteFile.Close()

	// Read the contents of the remote file
	remoteBytes, err := ioutil.ReadAll(remoteFile)
	if err != nil {
		fmt.Printf("Failed to read remote file: %v\n", err)
		os.Exit(1)
	}

	// Write the contents of the remote file to a local file
	err = ioutil.WriteFile("/path/to/local/file", remoteBytes, 0644)
	if err != nil {
		fmt.Printf("Failed to write local file: %v\n", err)
		os.Exit(1)
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

	fmt.Println("File transfer complete.")
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
