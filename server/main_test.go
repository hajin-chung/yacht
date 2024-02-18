package main

import (
	"fmt"
	"testing"
	"time"
)

func TestGenerateRotation(t *testing.T) {
	num := 5
	result := []int32{1, 2, 3, 5, 6}

	startTime := time.Now()
	buffer, err := GenerateSimulation(num, result)
	elapsedTime := time.Since(startTime)
	if err == nil {
		fmt.Printf("buffer length: %d, took: %s\n", len(buffer), elapsedTime)
		fmt.Printf("%+v\n", buffer[:100])
	} else {
		t.Error(err)
	}
}
