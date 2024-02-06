package main

import (
	"errors"
	"log"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func WebsocketUpgrade(c *fiber.Ctx) error {
	if websocket.IsWebSocketUpgrade(c) {
		return c.Next()
	}
	return fiber.ErrUpgradeRequired
}

func WebSocketHandler(c *websocket.Conn) {
	id := c.Locals("id").(string)
	socket := WebSocket{
		Conn: c,
	}
	log.Printf("%+v", socket.Conn)
	hub.Add(id, &socket)
}

type WebSocket struct {
	*websocket.Conn
}

func (ws *WebSocket) Read() (string, error) {
	log.Printf("hihi %+v", ws.Conn)

	mt, msg, err := ws.ReadMessage()
	if err != nil {
		log.Printf("hihi err: %s", err)
		return "", err
	}
	if mt != websocket.TextMessage {
		return "", errors.New("message is not text")
	}

	return string(msg[:]), nil
}

func (ws *WebSocket) Write(content string) error {
	err := ws.WriteMessage(websocket.TextMessage, []byte(content))
	return err
}

func (ws *WebSocket) Close() {
	ws.Conn.Close()
}

func (ws *WebSocket) Type() string {
	return "websocket"
}

func (ws *WebSocket) Info() {
	log.Printf("%+v", ws.Conn)
}
