package main

import (
	"encoding/json"
	"fmt"
	"math/rand"

	"github.com/gofiber/fiber/v2"
)

func IndexHandler(c *fiber.Ctx) error {
	id := c.Locals("id").(string)
	msg := fmt.Sprintf("hello from yacht server\nyour id is: %s\n", id)

	if id[0] == '#' {
		msg += "you are not logged in"
	} else {
		msg += "you are logged in"
	}

	return c.SendString(msg)
}

type RotationPayload struct {
	Num int `json:"num"`
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

	buffer, err := GenerateSimulation(
		payload.Num,
		result,
	)

	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"result": result,
		"buffer": buffer,
	})
}
