package main

import (
	"log"

	"github.com/ttn-nguyen42/sidecar/helper/internal/service"
)

func main() {
	if err := service.Run(); err != nil {
		log.Fatal(err)
	}
}