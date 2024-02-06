package main

import (
	"github.com/gofiber/contrib/websocket"
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
	InitHub()

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
	}))
	app.Use(SessionMiddleware)

	app.Use("/ws", WebsocketUpgrade)
	app.Get("/ws", websocket.New(WebSocketHandler))
	app.Get("/", IndexHandler)
	app.Post("/test", TestHandler)
	app.Static("/test", "./test")

	app.Listen(":4434")
}
