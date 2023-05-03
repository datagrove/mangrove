package scrape

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/cookiejar"
	"net/url"

	"golang.org/x/net/html"
)

type Client struct {
	*http.Client
	jar  *cookiejar.Jar
	Page *Page
}

func NewClient(url string) (*Client, error) {
	jar, _ := cookiejar.New(nil)
	r := &Client{
		Client: &http.Client{Jar: jar},
		jar:    jar,
	}
	req, err := r.Get(url)
	if err != nil {
		return nil, err
	}
	r.Page, err = Parse(url, req)
	if err != nil {
		return nil, err
	}
	return r, nil
}

type Page struct {
	Client  *Client
	Url     string
	Form    map[string]string
	Link    map[string]string
	Cookies []*http.Cookie

	Body string
	Resp *http.Response
}

// this like a form clicking a button. Then there is probably a redirect.
func (cl *Client) PostBack(name string, value string) error {
	p := cl.Page
	// get the form
	// Create a new POST request to the form URL
	formValues := url.Values{}
	formValues.Set(name, value)
	for k, v := range p.Form {
		formValues.Set(k, v)
	}
	// formValues.Set(user, "alexm")
	// formValues.Set(pass, "demo123")
	req, err := cl.Post(p.Url, "application/x-www-form-urlencoded", bytes.NewBufferString(formValues.Encode()))
	if err != nil {
		return err
	}
	cl.Page, err = Parse(p.Url, req)
	return err
}

func (cl *Client) Print() {
	p := cl.Page
	// Print the response body
	fmt.Println(string(p.Body))
	for _, hdr := range p.Resp.Header {
		fmt.Printf("Header: %s\n", hdr)
	}
	// Print the cookies
	for _, cookie := range cl.jar.Cookies(p.Resp.Request.URL) {
		fmt.Printf("Cookie: %s=%s\n", cookie.Name, cookie.Value)
	}
}

func Parse(urlStr string, req *http.Response) (*Page, error) {
	defer req.Body.Close()
	bodyBytes, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}

	doc, err := html.Parse(bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}
	var fh = map[string]string{}
	// id -> href
	var link = map[string]string{}
	var hidden func(*html.Node)
	hidden = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "form" {
			for _, a := range n.Attr {
				if a.Key == "action" {
					base, _ := url.Parse(urlStr)
					v, _ := url.Parse(a.Val)
					urlStr = base.ResolveReference(v).String()
				}
			}
		}
		if n.Type == html.ElementNode && n.Data == "a" {
			var id, href string
			for _, a := range n.Attr {
				if a.Key == "id" {
					id = a.Val
				}
				if a.Key == "href" {
					href = a.Val
				}
			}
			link[id] = href
		}
		if n.Type == html.ElementNode && n.Data == "input" {
			var name, value string
			for _, a := range n.Attr {
				if a.Key == "name" {
					name = a.Val
				}
				if a.Key == "value" {
					value = a.Val
				}
			}
			fh[name] = value
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			hidden(c)
		}
	}
	hidden(doc)

	return &Page{
		Url:     urlStr,
		Form:    fh,
		Link:    link,
		Resp:    req,
		Body:    string(bodyBytes),
		Cookies: req.Cookies(),
	}, nil
}
