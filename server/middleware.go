package main

import (
	"github.com/gofiber/fiber/v2"
)

func SessionMiddleware(c *fiber.Ctx) error {
	sess, err := Store.Get(c)
	if err != nil {
		return err
	}

	// maybe we need to check if id is string or not?
	id := sess.Get("id")
	if id == nil {
		id = "#" + CreateId()
		sess.Set("id", id)
		sess.Save()
	}

	c.Locals("id", id)

	return c.Next()
}
