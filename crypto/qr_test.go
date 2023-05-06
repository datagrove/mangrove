package crypto

import (
	"testing"

	qrcode "github.com/skip2/go-qrcode"
)

func Test_qr(t *testing.T) {

	qrcode.WriteFile("https://example.org", qrcode.Medium, 256, "qr.png")

}
