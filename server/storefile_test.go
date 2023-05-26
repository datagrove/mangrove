package server

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"testing"

	"github.com/joho/godotenv"
)

func Test_r2(t *testing.T) {
	d, _ := os.Getwd()
	log.Printf("%s\n", d)
	godotenv.Load("./.env")
	cl, e := NewS3Client()
	if e != nil {
		panic(e)
	}

	u, e := cl.PresignPutObject("/test2.txt")
	if e != nil {
		panic(e)
	}
	e = putHttp(u, []byte("Hello, World!"))
	if e != nil {
		panic(e)
	}

	e = cl.Upload("/test.txt", []byte("hello world"))
	if e != nil {
		panic(e)
	}
}

func putHttp(url string, data []byte) error {
	req, err := http.NewRequest(http.MethodPut, url, ioutil.NopCloser(bytes.NewReader(data)))
	if err != nil {
		return err
	}

	client := http.DefaultClient
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Check the response status
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected response status: %d", resp.StatusCode)
	}

	return nil
}
