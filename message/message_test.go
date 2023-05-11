package message

import (
	"log"
	"testing"

	"github.com/joho/godotenv"
)

func Test_send(t *testing.T) {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	o := Email{
		Sender:    "jimh@datagrove.com",
		Recipient: "jimh@datagrove.com",
		Subject:   "aws test",
		Html:      "",
		Text:      "yo, wassup",
	}
	e := o.Send()
	if e != nil {
		panic(e)
	}
}

func Test_sms(t *testing.T) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	err = Sms("+14843664923", "yo, wassup")
	if err != nil {
		panic(err)
	}

}
func Test_sms_aws(t *testing.T) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	err = Sms_aws("+14843664923", "yo, wassup from aws")
	if err != nil {
		panic(err)
	}
}
func Test_voice(t *testing.T) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	err = Voice("+14843664923", "Your security code is 123456")
	if err != nil {
		panic(err)
	}

}
