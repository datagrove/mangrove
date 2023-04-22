package ucan

import (
	"crypto/ed25519"
	"fmt"
	"log"
	"testing"
	"time"

	"github.com/go-test/deep"
	//"github.com/libp2p/go-libp2p-core/crypto"
)

const (
	alt  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
	ucan = `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCIsInVjdiI6IjAuOC4xIn0.eyJhdWQiOiJkaWQ6a2V5Ono2TWtmUWhMSEJTRk11UjdiUVhUUWVxZTVrWVVXNTFIcGZaZWF5bWd5MXprUDJqTSIsImF0dCI6W3sid2l0aCI6eyJzY2hlbWUiOiJ3bmZzIiwiaGllclBhcnQiOiIvL2RlbW91c2VyLmZpc3Npb24ubmFtZS9wdWJsaWMvcGhvdG9zLyJ9LCJjYW4iOnsibmFtZXNwYWNlIjoid25mcyIsInNlZ21lbnRzIjpbIk9WRVJXUklURSJdfX0seyJ3aXRoIjp7InNjaGVtZSI6InduZnMiLCJoaWVyUGFydCI6Ii8vZGVtb3VzZXIuZmlzc2lvbi5uYW1lL3B1YmxpYy9ub3Rlcy8ifSwiY2FuIjp7Im5hbWVzcGFjZSI6InduZnMiLCJzZWdtZW50cyI6WyJPVkVSV1JJVEUiXX19XSwiZXhwIjo5MjU2OTM5NTA1LCJpc3MiOiJkaWQ6a2V5Ono2TWtyNWFlZmluMUR6akc3TUJKM25zRkNzbnZIS0V2VGIyQzRZQUp3Ynh0MWpGUyIsInByZiI6WyJleUpoYkdjaU9pSkZaRVJUUVNJc0luUjVjQ0k2SWtwWFZDSXNJblZqZGlJNklqQXVPQzR4SW4wLmV5SmhkV1FpT2lKa2FXUTZhMlY1T25vMlRXdHlOV0ZsWm1sdU1VUjZha2MzVFVKS00yNXpSa056Ym5aSVMwVjJWR0l5UXpSWlFVcDNZbmgwTVdwR1V5SXNJbUYwZENJNlczc2lkMmwwYUNJNmV5SnpZMmhsYldVaU9pSjNibVp6SWl3aWFHbGxjbEJoY25RaU9pSXZMMlJsYlc5MWMyVnlMbVpwYzNOcGIyNHVibUZ0WlM5d2RXSnNhV012Y0dodmRHOXpMeUo5TENKallXNGlPbnNpYm1GdFpYTndZV05sSWpvaWQyNW1jeUlzSW5ObFoyMWxiblJ6SWpwYklrOVdSVkpYVWtsVVJTSmRmWDFkTENKbGVIQWlPamt5TlRZNU16azFNRFVzSW1semN5STZJbVJwWkRwclpYazZlalpOYTJ0WGIzRTJVek4wY1ZKWGNXdFNibmxOWkZobWNuTTFORGxGWm5VMmNVTjFOSFZxUkdaTlkycEdVRXBTSWl3aWNISm1JanBiWFgwLlNqS2FIR18yQ2UwcGp1TkY1T0QtYjZqb04xU0lKTXBqS2pqbDRKRTYxX3VwT3J0dktvRFFTeFo3V2VZVkFJQVREbDhFbWNPS2o5T3FPU3cwVmc4VkNBIiwiZXlKaGJHY2lPaUpGWkVSVFFTSXNJblI1Y0NJNklrcFhWQ0lzSW5WamRpSTZJakF1T0M0eEluMC5leUpoZFdRaU9pSmthV1E2YTJWNU9ubzJUV3R5TldGbFptbHVNVVI2YWtjM1RVSktNMjV6UmtOemJuWklTMFYyVkdJeVF6UlpRVXAzWW5oME1XcEdVeUlzSW1GMGRDSTZXM3NpZDJsMGFDSTZleUp6WTJobGJXVWlPaUozYm1aeklpd2lhR2xsY2xCaGNuUWlPaUl2TDJSbGJXOTFjMlZ5TG1acGMzTnBiMjR1Ym1GdFpTOXdkV0pzYVdNdmNHaHZkRzl6THlKOUxDSmpZVzRpT25zaWJtRnRaWE53WVdObElqb2lkMjVtY3lJc0luTmxaMjFsYm5SeklqcGJJazlXUlZKWFVrbFVSU0pkZlgxZExDSmxlSEFpT2preU5UWTVNemsxTURVc0ltbHpjeUk2SW1ScFpEcHJaWGs2ZWpaTmEydFhiM0UyVXpOMGNWSlhjV3RTYm5sTlpGaG1jbk0xTkRsRlpuVTJjVU4xTkhWcVJHWk5ZMnBHVUVwU0lpd2ljSEptSWpwYlhYMC5TakthSEdfMkNlMHBqdU5GNU9ELWI2am9OMVNJSk1waktqamw0SkU2MV91cE9ydHZLb0RRU3haN1dlWVZBSUFURGw4RW1jT0tqOU9xT1N3MFZnOFZDQSJdfQ.Ab-xfYRoqYEHuo-252MKXDSiOZkLD-h1gHt8gKBP0AVdJZ6Jruv49TLZOvgWy9QkCpiwKUeGVbHodKcVx-azCQ`
)

func LogPayload(claims *Payload) {
	fmt.Printf("To: %s\n", claims.To)
	fmt.Printf("From: %s\n", claims.From)
	fmt.Printf("Expires:%s\n", time.Unix(claims.Expires, 0))
	fmt.Printf("Not Before:%s\n", time.Unix(claims.NotBefore, 0))
	for _, p := range claims.Proof {
		fmt.Printf("Proof: %s\n", p)
	}
	for _, a := range claims.Grant {
		fmt.Printf("Can: %s\n", a.Can)
		fmt.Printf("With: %s\n", a.With)
	}
}

func Test_decode(t *testing.T) {
	claims, err := DecodeUcan(ucan)
	if err != nil {
		t.Fatal(err)
	}
	LogPayload(claims)
}

func Test_encode_decode(t *testing.T) {
	pub, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}
	did, e := EncodeDid(pub)
	if e != nil {
		t.Fatal(e)
	}
	b := &Payload{
		To: did,
		Grant: []Attenuate{
			{
				With: []byte(`"one"`),
				Can:  []byte(`"two"`),
			},
		},
		Expires: time.Now().Unix() + 3600*24,
		From:    did,
		Proof:   []string{},
	}
	enc, err := EncodeUcan(b, priv)
	log.Print(enc)
	if err != nil {
		t.Fatal(err)
	}
	a, e := DecodeUcan(enc)
	if e != nil {
		t.Fatal(e)
	}
	LogPayload(a)
	if diff := deep.Equal(a, b); diff != nil {
		t.Error(diff)
	}
}

func Test_one(t *testing.T) {
	keyStrED := "did:key:z6Mkmzs1Z6tYCj42ncwqrxAb9jqt6Zj6GGnzQc5yi6jNBmva"
	id, err := DecodeDid(keyStrED)
	if err != nil {
		t.Fatal(err)
	}
	str, _ := EncodeDid(id)
	if str != keyStrED {
		t.Errorf("string mismatch.\nwant: %q\ngot:  %q", keyStrED, str)
	}
}
