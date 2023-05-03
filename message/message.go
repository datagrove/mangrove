package message

import (
	"encoding/binary"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/aws/aws-sdk-go/service/sns"

	"github.com/twilio/twilio-go"
	twilioApi "github.com/twilio/twilio-go/rest/api/v2010"
)

func Sms(to string, message string) error {

	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: os.Getenv("TWILIO_SID"),
		Password: os.Getenv("TWILIO_AUTH"),
	})

	params := &twilioApi.CreateMessageParams{}
	params.SetTo(to)
	params.SetFrom(os.Getenv("TWILIO_NUMBER"))
	params.SetBody(message)

	_, err := client.Api.CreateMessage(params)
	if err != nil {
		return err
	} else {
		return nil
	}
}

const (
	call = `<?xml version="1.0" encoding="UTF-8"?>
	<Response>
	<Say voice="alice">%s</Say>
	</Response>`
)

func Voice(to string, message string) error {
	s := fmt.Sprintf(call, message)
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: os.Getenv("TWILIO_SID"),
		Password: os.Getenv("TWILIO_AUTH"),
	})
	params := &twilioApi.CreateCallParams{}
	params.SetTwiml(s)
	params.SetTo(to)
	params.SetFrom(os.Getenv("TWILIO_NUMBER"))

	resp, err := client.Api.CreateCall(params)
	if err != nil {
		log.Println(err)
		return err
	}
	fmt.Println(resp)
	return nil
}

func CreateCode() (string, error) {
	b, e := SecureRandomBytes(4)
	if e != nil {
		return "", e
	}
	code := binary.LittleEndian.Uint32(b) % 1000000
	return fmt.Sprintf("%d", code), nil
}

func confirmSms(sms string, msg string) error {
	sess := session.Must(session.NewSession())
	fmt.Println("session created")

	svc := sns.New(sess)
	fmt.Println("service created")

	params := &sns.PublishInput{
		Message:     aws.String(msg),
		PhoneNumber: aws.String(sms),
	}
	resp, err := svc.Publish(params)

	if err != nil {
		// Print the error, cast err to awserr.Error to get the Code and
		// Message from an error.
		log.Println(err.Error())
		return err
	}

	// Pretty-print the response data.
	fmt.Println(resp)
	return nil
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

func (em *Email) Send() error {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1")},
	)

	// Create an SES session.
	svc := ses.New(sess)

	// Assemble the email.
	sender := em.Sender
	if len(sender) == 0 {
		sender = os.Getenv("email_sender")
	}
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
