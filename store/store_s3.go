package store

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Account struct {
	accountId, accessKeyId, accessKeySecret, bucketName string
}

type S3Client struct {
	Account
	s3 *s3.Client
}

func (cl *S3Client) List(prefix string) (*s3.ListObjectsV2Output, error) {
	// Set up the parameters for listing objects
	listInput := &s3.ListObjectsV2Input{
		Bucket: aws.String(cl.bucketName),
		Prefix: aws.String(prefix),
	}

	// Perform the list operation
	resp, err := cl.s3.ListObjectsV2(context.TODO(), listInput)
	return resp, err
}

func (cl *S3Client) Get(filePath string) ([]byte, error) {
	getInput := &s3.GetObjectInput{
		Bucket: aws.String(cl.bucketName),
		Key:    aws.String(filePath),
	}

	// Perform the get operation
	resp, err := cl.s3.GetObject(context.TODO(), getInput)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Read the object contents
	return ioutil.ReadAll(resp.Body)
}

func (client *S3Client) Upload(path string, mime string, data []byte) error {
	uploadInput := &s3.PutObjectInput{
		Bucket:      aws.String(client.bucketName),
		Key:         aws.String(path), // This sets the object key to the same value as the file path
		Body:        bytes.NewReader(data),
		ContentType: aws.String(mime),
	}
	_, err := client.s3.PutObject(context.TODO(), uploadInput)
	return err
}
func (cl *S3Client) PresignPutObject(filePath string) (string, error) {

	// Set up the parameters for generating the presigned URL
	presignInput := &s3.PutObjectInput{
		Bucket: aws.String(cl.bucketName),
		Key:    aws.String(filePath),
	}

	// Generate the presigned URL

	presignClient := s3.NewPresignClient(cl.s3)
	presignOutput, err := presignClient.PresignPutObject(
		context.TODO(),
		presignInput,
		func(opt *s3.PresignOptions) {
			opt.Expires = time.Duration(1 * time.Hour) // Set the expiration time for the presigned URL
		})
	if err != nil {
		return "", err
	}
	return presignOutput.URL, nil
}

func NewS3Client() (*S3Client, error) {
	a := Account{
		accountId:       os.Getenv("r2_account_id"),
		accessKeyId:     os.Getenv("r2_key_id"),
		accessKeySecret: os.Getenv("r2_key_secret"),
		bucketName:      os.Getenv("r2_bucket_name"),
	}

	r2Resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL: fmt.Sprintf("https://%s.r2.cloudflarestorage.com", a.accountId),
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithEndpointResolverWithOptions(r2Resolver),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(a.accessKeyId, a.accessKeySecret, "")),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(cfg)
	return &S3Client{
		Account: a,
		s3:      client,
	}, nil
}
