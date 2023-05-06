package mangrove

import (
	"fmt"
	"time"

	"github.com/roylee0704/gron"
)

func Xx() {
	c := gron.New()
	c.AddFunc(gron.Every(1*time.Hour), func() {
		fmt.Println("runs every hour.")
	})
	c.Start()
}
