package jobview

import qrcode "github.com/skip2/go-qrcode"

func NewQrCode(data string) ([]byte, error) {
	return qrcode.Encode(data, qrcode.Medium, 256)
}
