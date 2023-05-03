package main

import (
	"os"
	"testing"

	"github.com/datagrove/mangrove/scrape"
)

func Test_start(t *testing.T) {
	os.Args = []string{"proxy", "start"}
	main()
}

func Test_embed(t *testing.T) {
	justEmbed()
}

func Test_embed2(t *testing.T) {
	justEmbed2()
}

const (
	user = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInUserName"
	pass = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInPassword"

	// urlx = "https://datagrove_servr/iCore/Contacts/Sign_In.aspx?LoginRedirect=true&returnurl=%2fMBRR%2fiSamples%2fMemberR%2fDefault.aspx%3fhkey%3d96ddafab-81a2-4e33-8182-2bdb8439d828"

	home = "https://datagrove_servr/MBRR"
)

// javascript:__doPostBack('ctl01$ciUtilityNavigation$ctl03$LoginStatus1$ctl02','')
//_doPostBack('mybut','save')

/*
ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$SubmitButton
value="Sign In"
*/

func Test_fubar(t *testing.T) {

	cl, e := scrape.NewClient("https://datagrove_servr/iCore/Contacts/Sign_In.aspx?LoginRedirect=true&returnurl=%2fMBRR")
	if e != nil {
		panic(e)
	}
	// this postback should get the login cookie
	cl.Page.Form[user] = "alexm"
	cl.Page.Form[pass] = "demo123"
	e = cl.PostBack("ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$SubmitButton", "Sign In")
	cl.Print()
}

func Test_login(t *testing.T) {
	cl, e := scrape.NewClient(home)
	if e != nil {
		panic(e)
	}
	//cl.Print()

	// this postback should get the login page, but it doesn't
	e = cl.PostBack("ctl01$ciUtilityNavigation$ctl03$LoginStatus1$ctl02", "")
	if e != nil {
		panic(e)
	}
	cl.Print()

	// this postback should get the login cookie
	cl.Page.Form[user] = "alexm"
	cl.Page.Form[pass] = "demo123"
	e = cl.PostBack("ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$SubmitButton", "Sign In")
	if e != nil {
		panic(e)
	}

	cl.Print()

}

// Cookie: ASP.NET_SessionId=pu3aruk34tiryqgnhvsz3cbo
// Cookie: ASP.NET_SessionId=pu3aruk34tiryqgnhvsz3cbo
// Cookie: __RequestVerificationToken=l1eajE-d4PUHNJbpbWt-LTOBCBZrE-pTtXWG-cBKSgvqFkN2KdYscNaX15vFamry92RBjy4b1v-yidb4nsNlvCm9e1HLid9HyWt4oQe5ELE1
