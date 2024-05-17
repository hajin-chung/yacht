package main

import (
	"fmt"
	"math/rand"
	"testing"
)

func randomDice() uint8 {
	return uint8(rand.Uint32()%6 + 1)
}

func randomSelection() int {
	return int(rand.Uint32() % 12)
}

func TestCalculateScore(t *testing.T) {
	for i := 0; i < 30; i++ {
		dice := [5]uint8{randomDice(), randomDice(), randomDice(), randomDice(), randomDice()}
		selection := randomSelection()
		score := CalculateScore(dice, selection)

		fmt.Printf("%+v %d %d\n", dice, selection, score)
	}
}
