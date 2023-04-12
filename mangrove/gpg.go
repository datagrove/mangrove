package mangrove

import (
	"os"

	"github.com/ProtonMail/gopenpgp/v2/crypto"
	"github.com/ProtonMail/gopenpgp/v2/helper"
)

// https://pkg.go.dev/github.com/ProtonMail/gopenpgp/v2/crypto

func Encrypt(inf, outf string, key []string) error {
	ring, e := crypto.NewKeyRing(nil)
	if e != nil {
		return e
	}
	for _, k := range key {
		pubkey, e := os.ReadFile(k)
		if e != nil {
			return e
		}
		pk, e := crypto.NewKeyFromArmored(string(pubkey))
		if e != nil {
			return e
		}
		ring.AddKey(pk)
	}

	message, err := os.ReadFile(inf)
	if err != nil {
		return err
	}
	plain := crypto.NewPlainMessage(message)
	cipher, err := ring.Encrypt(plain, ring)
	if err != nil {
		return err
	}
	return os.WriteFile(outf, cipher.GetBinary(), 0644)
}
func Decrypt(inf, outf, privkeyf string) error {
	// pubkey, e := os.ReadFile(pubkeyf)
	// if e != nil {
	// 	return e
	// }
	privkey, e := os.ReadFile(privkeyf)
	if e != nil {
		return e
	}
	pk, e := crypto.NewKeyFromArmored(string(privkey))
	if e != nil {
		return e
	}
	ring, e := crypto.NewKeyRing(pk)

	// decrypt armored encrypted message using the private key and obtain plain text
	b, e := os.ReadFile(inf)
	if e != nil {
		return e
	}
	//cm := crypto.NewClearTextMessage(b, nil)
	cm := crypto.NewPGPMessage(b)
	decrypted, err := ring.Decrypt(cm, nil, 0)
	if err != nil {
		return err
	}
	return os.WriteFile(outf, decrypted.GetBinary(), 0644)
}

func GeneratePgpKey(name, email string, outfile string) error {
	var (
		rsaBits = 2048
	)
	var passphrase []byte
	// RSA, string
	rsaKey, err := helper.GenerateKey(name, email, passphrase, "rsa", rsaBits)
	if err != nil {
		return err
	}
	return os.WriteFile(outfile, []byte(rsaKey), 0644)
}

/*
func signMessage(privkey, infile string, outfile string) error {
	data, e := os.ReadFile(infile)
	message := crypto.NewPlainMessage(data)

	if e != nil {
		return e
	}
	p, err := crypto.NewKeyFromArmored(privkey)
	if err != nil {
		return err
	}
	//unlockedKeyObj = privateKeyObj.Unlock(passphrase)
	signingKeyRing, err := crypto.NewKeyRing(p)
	sig, err := signingKeyRing.SignDetachedEncrypted(message)

	// The armored signature is in pgpSignature.GetArmored()
	// The signed text is in message.GetString()
	return os.WriteFile(outfile, []byte(sig.GetString()), 0644)

}
func verifyMessage(pubkey, signature string) {

	message := crypto.NewClearTextMessage("Verified message")
	pgpSignature, err := crypto.NewPGPSignatureFromArmored(signature)

	publicKeyObj, err := crypto.NewKeyFromArmored(pubkey)
	signingKeyRing, err := crypto.NewKeyRing(publicKeyObj)

	err := signingKeyRing.VerifyDetached(message, pgpSignature, crypto.GetUnixTime())

	if err == nil {
		// verification success
	}
}
*/
