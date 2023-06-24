package ucan

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"

	mb "github.com/multiformats/go-multibase"
	varint "github.com/multiformats/go-varint"
)

type Header struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
	Ucv string `json:"ucv"`
}
type Payload struct {
	To        string      `json:"aud"`
	Grant     []Attenuate `json:"att"`
	NotBefore int64       `json:"npf,omitempty"`
	Expires   int64       `json:"exp"`
	From      string      `json:"iss"`
	Proof     []string    `json:"prf"`
}
type Attenuate struct {
	With json.RawMessage `json:"with"`
	Can  json.RawMessage `json:"can"`
	Nb   json.RawMessage `json:"nb,omitempty"`
}

func DecodeUcan(raw string) (*Payload, error) {
	parts := strings.Split(raw, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}
	var err error
	partsb := make([][]byte, 3)
	for i := range parts {
		partsb[i], err = base64.RawURLEncoding.DecodeString(parts[i])
		if err != nil {
			return nil, fmt.Errorf("error decoding part %d: %w", i, err)
		}
	}
	var pld Payload
	err = json.Unmarshal(partsb[1], &pld)
	if err != nil {
		return nil, fmt.Errorf("error decoding payload: %w", err)
	}
	key, err := DecodeDid(pld.From)
	if err != nil {
		return nil, fmt.Errorf("error decoding key: %w", err)
	}
	msg := raw[:len(raw)-len(parts[2])-1]
	if !ed25519.Verify(key, []byte(msg), partsb[2]) {
		return nil, fmt.Errorf("error verifying signature")
	}
	return &pld, nil
}

func EncodeUcan(b *Payload, kp ed25519.PrivateKey) (string, error) {
	pld, e := json.Marshal(b)
	if e != nil {
		return "", e
	}
	msg := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"EdDSA","typ":"JWT","ucv":"0.8.1"}`)) + "." + base64.RawURLEncoding.EncodeToString([]byte(pld))

	// Sign the string and return the encoded result
	sig := base64.RawURLEncoding.EncodeToString(ed25519.Sign(kp, []byte(msg)))
	return strings.Join([]string{msg, sig}, "."), nil
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

	cd, err := mb.Encode(mb.Base58BTC, data)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("did:key:%s", cd), nil
}

// Parse turns a string into a key method ID
func DecodeDid(keystr string) (ed25519.PublicKey, error) {
	if !strings.HasPrefix(keystr, "did:key:") {
		return nil, fmt.Errorf("must start with did:key:")
	}
	keystr = strings.TrimPrefix(keystr, "did:key:")
	_, data, err := mb.Decode(keystr)
	if err != nil {
		return nil, err
	}
	keyType, n, err := varint.FromUvarint(data)
	if err != nil {
		return nil, err
	}
	if keyType != 0xed {
		return nil, fmt.Errorf("unsupported key type: %d", keyType)
	}
	return ed25519.PublicKey(data[n:]), nil
}

func VerifyDid(h []byte, did string, signature []byte) bool {
	x, e := DecodeDid(did)
	if e != nil {
		return false
	}
	return ed25519.Verify(x, h, signature)
}
