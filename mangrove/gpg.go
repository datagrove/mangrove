package mangrove

import (
	"github.com/ProtonMail/gopenpgp/v2/crypto"
)

func Encrypt(fs *FileSystem, inf, outf string) {

}
func Decrypt(fs *FileSystem, inf, outf string) {
	var x crypto.ClearTextMessage
	_ = x
	// // put keys in backtick (``) to avoid errors caused by spaces or tabs
	// const pubkey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
	// ...
	// -----END PGP PUBLIC KEY BLOCK-----`

	// const privkey = `-----BEGIN PGP PRIVATE KEY BLOCK-----
	// ...
	// -----END PGP PRIVATE KEY BLOCK-----` // encrypted private key

	// const passphrase = []byte(`the passphrase of the private key`) // Passphrase of the privKey

	// // encrypt plain text message using public key
	//armor, err := helper.EncryptMessageArmored(pubkey, "plain text")

	// // decrypt armored encrypted message using the private key and obtain plain text
	// decrypted, err := helper.DecryptMessageArmored(privkey, passphrase, armor)

	// // encrypt binary message using public key
	// armor, err := helper.EncryptBinaryMessageArmored(pubkey, []byte("plain text"))

	// // decrypt armored encrypted message using the private key expecting binary data
	// decrypted, err := helper.DecryptBinaryMessageArmored(privkey, passphrase, armor)
}
