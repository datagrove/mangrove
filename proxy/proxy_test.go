package main

import (
	"io/fs"
	"log"
	"net/http"
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
func justEmbed() {
	mux := http.NewServeMux()

	var staticFS = fs.FS(Res)
	// should this be in config?
	htmlContent, err := fs.Sub(staticFS, "ui/dist")
	if err != nil {
		panic(err)
	}
	fs := http.FileServer(&spaFileSystem{http.FS(htmlContent)})
	mux.Handle("/embed/", http.StripPrefix("/embed/", fs))

	log.Fatal(http.ListenAndServe(":8080", mux))
}

func justEmbed2() {
	mux := http.NewServeMux()

	var staticFS = fs.FS(Res)
	// should this be in config?
	htmlContent, err := fs.Sub(staticFS, "ui/dist")
	if err != nil {
		panic(err)
	}
	fs := http.FileServer(&spaFileSystem{http.FS(htmlContent)})
	mux.Handle("/", fs)

	log.Fatal(http.ListenAndServe(":8080", mux))
}

const (
	home = "https://datagrove_servr"
)

// javascript:__doPostBack('ctl01$ciUtilityNavigation$ctl03$LoginStatus1$ctl02','')
//_doPostBack('mybut','save')

/*
ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$SubmitButton
value="Sign In"
*/

func Test_login2(t *testing.T) {
	opt = GetOpts()
	c, e := ImisLogin("alexm", "demo123")
	if e != nil {
		t.Log(e)
		t.Fail()
	}
	t.Log(c)
}

func Test_fubar(t *testing.T) {
	cl, e := scrape.NewClient("https://datagrove_servr/iCore/Contacts/Sign_In.aspx?LoginRedirect=true&returnurl=%2fMBRR")
	if e != nil {
		panic(e)
	}
	// this postback should get the login cookie
	cl.Page.Form[userFieldName] = "alexm"
	cl.Page.Form[passFieldName] = "demo123"
	e = cl.PostBack("ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$SubmitButton", "Sign In")
	cl.Print()
}

// unclear why this doesn't work
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
	cl.Page.Form[userFieldName] = "alexm"
	cl.Page.Form[passFieldName] = "demo123"
	e = cl.PostBack("ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$SubmitButton", "Sign In")
	if e != nil {
		panic(e)
	}

	cl.Print()

}

// Cookie: ASP.NET_SessionId=pu3aruk34tiryqgnhvsz3cbo
// Cookie: ASP.NET_SessionId=pu3aruk34tiryqgnhvsz3cbo
// Cookie: __RequestVerificationToken=l1eajE-d4PUHNJbpbWt-LTOBCBZrE-pTtXWG-cBKSgvqFkN2KdYscNaX15vFamry92RBjy4b1v-yidb4nsNlvCm9e1HLid9HyWt4oQe5ELE1
// javascript:__doPostBack('ctl01$ciUtilityNavigation$ctl03$LoginStatus1$ctl02','')
//_doPostBack('mybut','save')

/*
ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$SubmitButton
value="Sign In"
*/
