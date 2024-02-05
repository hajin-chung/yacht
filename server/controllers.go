package main

import (
	"encoding/json"
	"math/rand"

	"github.com/gofiber/fiber/v2"
)

func IndexHandler(c *fiber.Ctx) error {
	return c.SendString("hello from yacht server")
}

type RotationPayload struct {
	Num          int       `json:"num"`
	Translations []float32 `json:"translations"`
	Rotations    []float32 `json:"rotations"`
}

func TestHandler(c *fiber.Ctx) error {
	body := c.Body()
	payload := RotationPayload{}

	err := json.Unmarshal(body, &payload)
	if err != nil {
		return err
	}

	result := []int32{}
	for i := 0; i < payload.Num; i++ {
		result = append(result, int32(rand.Intn(6))+1)
	}

	rotations, err := GenerateRotation(
		payload.Num,
		result,
		payload.Translations,
		payload.Rotations,
	)

	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"result":    result,
		"rotations": rotations,
	})
}
