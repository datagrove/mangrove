package message

import (
	"fmt"
	"log"
	"os"

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
