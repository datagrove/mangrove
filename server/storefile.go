package server

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"time"

	"context"

	"github.com/fxamacker/cbor/v2"
	"github.com/joho/godotenv"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
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

func (cl *S3Client) List(prefix string, start int) (*s3.ListObjectsV2Output, error) {
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

// we should generate a putobject and let the browser upload the file.
func fileApi(mg *Server) {
	cl, e := NewS3Client()
	if e != nil {
		log.Fatal(e)
	}
	godotenv.Load()
	mg.AddApi("write", true, func(a *Rpcp) (any, error) {
		var v struct {
			Sid  int64  `json:"sid,omitempty"` // we have to make sure they can write this
			Path string `json:"path,omitempty"`
			Mime string `json:"mime,omitempty"`
			Data []byte `json:"data,omitempty"`
		}
		cbor.Unmarshal(a.Params, &v)
		if !mg.Can(a.Session, v.Sid, 2) {
			return nil, fmt.Errorf("no permission")
		}
		filePath := fmt.Sprintf("/%d/%s", v.Sid, v.Path)
		//return cl.PresignPutObject(filePath)
		return nil, cl.Upload(filePath, v.Mime, v.Data)
	})

	// read we can do directly from r2
}

// listObjectsOutput, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
// 	Bucket: &a.bucketName,
// })
// if err != nil {
// 	return err
// }

// for _, object := range listObjectsOutput.Contents {
// 	obj, _ := json.MarshalIndent(object, "", "\t")
// 	fmt.Println(string(obj))
// }

//  {
//  	"ChecksumAlgorithm": null,
//  	"ETag": "\"eb2b891dc67b81755d2b726d9110af16\"",
//  	"Key": "ferriswasm.png",
//  	"LastModified": "2022-05-18T17:20:21.67Z",
//  	"Owner": null,
//  	"Size": 87671,
//  	"StorageClass": "STANDARD"
//  }

// listBucketsOutput, err := client.ListBuckets(context.TODO(), &s3.ListBucketsInput{})
// if err != nil {
// 	log.Fatal(err)
// }

// for _, object := range listBucketsOutput.Buckets {
// 	obj, _ := json.MarshalIndent(object, "", "\t")
// 	fmt.Println(string(obj))
// }

// {
// 		"CreationDate": "2022-05-18T17:19:59.645Z",
// 		"Name": "sdk-example"
// }

// Presigner encapsulates the Amazon Simple Storage Service (Amazon S3) presign actions
// used in the examples.
// It contains PresignClient, a client that is used to presign requests to Amazon S3.
// Presigned requests contain temporary credentials and can be made from any HTTP client.
type Presigner struct {
	PresignClient *s3.PresignClient
}

// GetObject makes a presigned request that can be used to get an object from a bucket.
// The presigned request is valid for the specified number of seconds.
func (presigner Presigner) GetObject(
	bucketName string, objectKey string, lifetimeSecs int64) (*v4.PresignedHTTPRequest, error) {
	request, err := presigner.PresignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(lifetimeSecs * int64(time.Second))
	})
	if err != nil {
		log.Printf("Couldn't get a presigned request to get %v:%v. Here's why: %v\n",
			bucketName, objectKey, err)
	}
	return request, err
}

// PutObject makes a presigned request that can be used to put an object in a bucket.
// The presigned request is valid for the specified number of seconds.
func (presigner Presigner) PutObject(
	bucketName string, objectKey string, lifetimeSecs int64) (*v4.PresignedHTTPRequest, error) {
	request, err := presigner.PresignClient.PresignPutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(lifetimeSecs * int64(time.Second))
	})
	if err != nil {
		log.Printf("Couldn't get a presigned request to put %v:%v. Here's why: %v\n",
			bucketName, objectKey, err)
	}
	return request, err
}

// DeleteObject makes a presigned request that can be used to delete an object from a bucket.
func (presigner Presigner) DeleteObject(bucketName string, objectKey string) (*v4.PresignedHTTPRequest, error) {
	request, err := presigner.PresignClient.PresignDeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		log.Printf("Couldn't get a presigned request to delete object %v. Here's why: %v\n", objectKey, err)
	}
	return request, err
}
