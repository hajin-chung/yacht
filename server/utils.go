package main

import (
	"log"

	"github.com/nrednav/cuid2"
)

var CreateId func() string

func InitId() error {
	log.Println("Initializing id")
	generate, err := cuid2.Init(
		cuid2.WithLength(10),
	)
	CreateId = generate
	return err
}
