package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	var err error

	InitStore()
	err = InitId()
	if err != nil {
		return
	}
	err = InitDB()
	if err != nil {
		return
	}

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
	}))

	app.Use(SessionMiddleware)

	app.Get("/", IndexHandler)
	app.Post("/test", TestHandler)

	app.Listen(":4434")
}
