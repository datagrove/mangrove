package message

import (
	"encoding/binary"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/aws/aws-sdk-go/service/sns"
)

// todo: get sns access https://medium.com/@antoniosito/setting-up-sms-sign-up-in-on-the-server-a-twilio-and-aws-sns-comparison-df2c6b9b6d95
// make an interface

func CreateCode() (string, error) {
	b, e := SecureRandomBytes(4)
	if e != nil {
		return "", e
	}
	code := binary.LittleEndian.Uint32(b) % 1000000
	return fmt.Sprintf("%d", code), nil
}

type Email struct {
	Sender    string
	Recipient string
	Subject   string
	Html      string
	Text      string
}

const (
	CharSet = "UTF-8"
)

func Sms_aws(to, message string) error {

	sess, err := session.NewSession(&aws.Config{
		CredentialsChainVerboseErrors:     nil,
		Credentials:                       nil, //&credentials.Credentials{},
		Endpoint:                          nil, //new(string),
		EndpointResolver:                  nil,
		EnforceShouldRetryCheck:           nil,
		Region:                            aws.String("us-east-1"),
		DisableSSL:                        nil,
		HTTPClient:                        nil, //&http.Client{},
		LogLevel:                          nil, //&0,
		Logger:                            nil,
		MaxRetries:                        nil, //new(int),
		Retryer:                           nil,
		DisableParamValidation:            nil,
		DisableComputeChecksums:           nil,
		S3ForcePathStyle:                  nil,
		S3Disable100Continue:              nil,
		S3UseAccelerate:                   nil,
		S3DisableContentMD5Validation:     nil,
		S3UseARNRegion:                    nil,
		LowerCaseHeaderMaps:               nil,
		EC2MetadataDisableTimeoutOverride: nil,
		EC2MetadataEnableFallback:         nil,
		UseDualStack:                      nil,
		UseDualStackEndpoint:              0,
		UseFIPSEndpoint:                   0,
		SleepDelay:                        nil, //func(time.Duration) {},
		DisableRestProtocolURICleaning:    nil,
		EnableEndpointDiscovery:           nil,
		DisableEndpointHostPrefix:         nil,
		STSRegionalEndpoint:               0,
		S3UsEast1RegionalEndpoint:         0,
	},
	)
	if err != nil {
		return err
	}

	// Create SNS service
	svc := sns.New(sess)

	// Pass the phone number and message.
	params := &sns.PublishInput{
		Message:                aws.String(message),
		MessageAttributes:      nil, //map[string]*sns.MessageAttributeValue{},
		MessageDeduplicationId: nil,
		MessageGroupId:         nil,
		MessageStructure:       nil,
		PhoneNumber:            aws.String(to),
		Subject:                nil,
		TargetArn:              nil,
		TopicArn:               nil,
	}

	resp, err := svc.Publish(params)
	if err != nil {
		return err
	}
	fmt.Println(resp) // print the response data.
	return nil
}
func (em *Email) Send() error {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1")},
	)
	if err != nil {
		return err
	}

	// Create an SES session.
	svc := ses.New(sess)

	// Assemble the email.

	input := &ses.SendEmailInput{
		Destination: &ses.Destination{
			CcAddresses: []*string{},
			ToAddresses: []*string{
				aws.String(em.Recipient),
			},
		},
		Message: &ses.Message{
			Body: &ses.Body{
				Text: &ses.Content{
					Data: aws.String(em.Text),
				},
			},
			Subject: &ses.Content{
				Data: aws.String(em.Subject),
			},
		},
		Source: aws.String(em.Sender),
		// Uncomment to use a configuration set
		//ConfigurationSetName: aws.String(ConfigurationSet),
	}

	// Attempt to send the email.
	result, err := svc.SendEmail(input)

	// Display error messages if they occur.
	if err != nil {
		return err
	}

	log.Println("Email Sent to address: " + em.Recipient)
	log.Println(result)
	return nil
}
