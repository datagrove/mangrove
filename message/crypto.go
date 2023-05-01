package message

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	paseto "github.com/o1egl/paseto"
)

// we need this to create one tome password
// SecureRandomBytes returns the requested number of bytes using crypto/rand
func SecureRandomBytes(length int) ([]byte, error) {
	var randomBytes = make([]byte, length)
	_, err := rand.Read(randomBytes)
	return randomBytes, err
}

func SecureRandomString(length int) (string, error) {
	b, e := SecureRandomBytes(length)
	return hex.EncodeToString(b), e
}

func encodeToken(encode string, secret []byte) string {

	now := time.Now()
	exp := now.Add(24 * time.Hour)
	nbt := now

	jsonToken := paseto.JSONToken{
		Audience:   "issi",
		Issuer:     "issi",
		Jti:        "123",
		Subject:    "access",
		IssuedAt:   now,
		Expiration: exp,
		NotBefore:  nbt,
	}

	//fmt.Println(len(secret))
	token, err := paseto.NewV2().Encrypt(secret, jsonToken, encode)
	if err != nil {
		panic(err)
	} else {
		//fmt.Println(token)
		return token
	}
}

func decodeToken(decode string, secret []byte) string {
	var newToken paseto.JSONToken
	var footer string
	err := paseto.NewV2().Decrypt(decode, secret, &newToken, &footer)
	if err == nil {
		return footer
	}
	return ""
}
