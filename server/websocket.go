package main

import (
	"errors"

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
	hub.Add(id, &socket)
	for {
	}
}

type WebSocket struct {
	*websocket.Conn
}

func (ws *WebSocket) Read() (interface{}, error) {
	mt, msg, err := ws.ReadMessage()
	if err != nil {
		return "", err
	}
	if mt == websocket.TextMessage {
		return string(msg[:]), nil
	} else if mt == websocket.BinaryMessage {
		return msg, nil
	}
	return nil, errors.New("unknown message type")
}

func (ws *WebSocket) Write(content interface{}) (err error) {
	switch content.(type) {
	case []byte:
		err = ws.WriteMessage(websocket.BinaryMessage, content.([]byte))
	case string:
		err = ws.WriteMessage(websocket.TextMessage, []byte(content.(string)))
	default:
		err = errors.New("content is neither []byte nor string")
	}
	return err
}

func (ws *WebSocket) Close() {
	ws.Conn.Close()
}

func (ws *WebSocket) Type() string {
	return "websocket"
}