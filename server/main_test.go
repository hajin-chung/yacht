package main

import (
	"fmt"
	"testing"
)

func TestGenerateRotation(t *testing.T) {
	num := 1
	result := []int{1}
	translations := []float32{0, 2, 0}
	rotations := []float32{0, 0, 0, 1}

	buffer, err := GenerateRotation(num, result, translations, rotations)
	if err == nil {
		fmt.Printf("%+v\n", buffer);
	} else {
		t.Error(err)
	}
}
