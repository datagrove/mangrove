package ucan

import (
	"crypto/ed25519"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/davecgh/go-spew/spew"
	"github.com/golang-jwt/jwt"
	mb "github.com/multiformats/go-multibase"
	varint "github.com/multiformats/go-varint"
)

type Attenuate struct {
	With string `json:"with"`
	Can  string `json:"can"`
}

type Header struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
	Ucv string `json:"ucv"`
}
type Payload struct {
	To        string      `json:"aud"`
	Grant     []Attenuate `json:"att"`
	NotBefore int64       `json:"nbf"`
	Expires   int64       `json:"exp"`
	From      string      `json:"iss"`
	Proof     []string    `json:"prf"`
}

func DecodeUcan(raw string) (*Payload, error) {
	fn := func(tok *jwt.Token) (interface{}, error) {
		mc, ok := tok.Claims.(jwt.MapClaims)
		if !ok {
			return nil, fmt.Errorf("fail")
		}

		iss, ok := mc["iss"].(string)
		if !ok {
			return nil, fmt.Errorf(`iss missing`)
		}

		b, err := DecodeDid(iss)
		if err != nil {
			return nil, err
		}
		return ed25519.PublicKey(b), nil
	}

	tok, err := jwt.Parse(raw, fn)
	if err != nil {
		return nil, err
	}

	claims, ok := tok.Claims.(jwt.MapClaims)
	if !ok || !tok.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	b, e := json.MarshalIndent(claims, "", " ")
	if e != nil {
		return nil, e
	}
	log.Printf("claims: %s", string(b))
	x := &Payload{}
	json.Unmarshal(b, x)
	return x, nil
	x.To = claims["aud"].(string)
	x.From = claims["iss"].(string)
	if claims["exp"] != nil {
		x.Expires = int64(claims["exp"].(float64))
	}
	if claims["nbf"] != nil {
		x.NotBefore = int64(claims["nbf"].(float64))
	}
	att := claims["att"].([]interface{})
	for _, v := range att {
		att := v.(map[string]interface{})
		spew.Dump(att)
		// with := att["with"]
		// can := att["can"]

		//x.Grant = append(Attenuate{with,can})
	}
	prf := claims["prf"].([]interface{})
	for _, v := range prf {
		x.Proof = append(x.Proof, v.(string))
	}
	return x, nil
}

type jwtClaims struct {
	*jwt.StandardClaims
	Prf []string    `json:"prf"`
	Att []Attenuate `json:"att"`
}

func EncodeUcan(b *Payload, kp ed25519.PrivateKey) (string, error) {
	a := jwt.New(jwt.SigningMethodEdDSA)
	a.Header["alg"] = "EdDSA"
	a.Header["typ"] = "JWT"
	a.Header["ucv"] = "0.8.1"

	a.Claims = &jwtClaims{
		StandardClaims: &jwt.StandardClaims{
			Audience:  b.To,
			ExpiresAt: b.Expires,
			NotBefore: b.NotBefore,
			Id:        b.From,
			Issuer:    b.From,
		},
		Att: b.Grant,
		Prf: b.Proof,
	}
	return a.SignedString(kp)
}

// String returns this did:key formatted as a string
func EncodeDid(raw ed25519.PublicKey) (string, error) {
	// raw, err := id.Raw()
	// if err != nil {
	// 	return "", err
	// }
	size := varint.UvarintSize(0xed)
	data := make([]byte, size+len(raw))
	n := varint.PutUvarint(data, 0xed)
	copy(data[n:], raw)

	// mb.Base58BTC,
	cd, err := mb.Encode(mb.Base64, data)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("did:key:%s", cd), nil
}

// Parse turns a string into a key method ID
func DecodeDid(keystr string) (ed25519.PublicKey, error) {
	if !strings.HasPrefix(keystr, "did:key") {
		return nil, fmt.Errorf("must start with did:key")
	}
	keystr = strings.TrimPrefix(keystr, "did:key:")
	_, data, err := mb.Decode(keystr)
	if err != nil {
		return nil, err
	}
	_, n, err := varint.FromUvarint(data)
	if err != nil {
		return nil, err
	}
	// pub, err := crypto.UnmarshalEd25519PublicKey(data[n:])
	// if err != nil {
	// 	return nil, err
	// }
	return ed25519.PublicKey(data[n:]), nil
}
