package main

import "github.com/nrednav/cuid2"

var CreateId func() string

func InitId() error {
	generate, err := cuid2.Init(
		cuid2.WithLength(10),
	)
	CreateId = generate
	return err
}
