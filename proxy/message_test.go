package main

import (
	"log"
	"testing"

	"github.com/datagrove/mangrove/message"

	"github.com/joho/godotenv"
)

func Test_send(t *testing.T) {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	o := message.Email{
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
	err = message.Sms("+14843664923", "yo, wassup")
	if err != nil {
		panic(err)
	}

}
