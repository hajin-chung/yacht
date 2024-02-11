package main

import (
	"errors"
	"log"

	"github.com/vmihailenco/msgpack/v5"
)

type Message interface{}

type InMessage struct {
	Type string             `msgpack:"type"`
	Data msgpack.RawMessage `msgpack:"data,omitempty"`
}

type OutMessage struct {
	Type  string      `msgpack:"type"`
	Data  interface{} `msgpack:"data,omitempty"`
	Error bool        `msgpack:"error"`
}

type ErrorOutMessage struct {
	Type  string `msgpack:"type"`
	Error bool   `msgpack:"error"`
}

func (h *Hub) Worker() {
	var err error
	for packet := range h.In {
		inMessage := &InMessage{}
		err = msgpack.Unmarshal(packet.Message, inMessage)
		if err != nil {
			h.SendMessage(packet.Id, "error", nil, err)
			continue
		}

		switch inMessage.Type {
		case "ping":
			h.SendMessage(packet.Id, "ping", nil, nil)
		case "queue":
			err = HandleQueue(packet.Id)
		case "cancelQueue":
			err = HandleCancelQueue(packet.Id)
		case "gameState":
			err = HandleGameState(packet.Id)
		case "shake":
			err = HandleShake(packet.Id)
		case "roll":
			err = HandleRoll(packet.Id)
		default:
			err = errors.New("unknown message type")
		}

		if err != nil {
			h.SendMessage(packet.Id, "error", nil, err)
			continue
		}
	}
}

func (h *Hub) SendMessage(id string, messageType string, data interface{}, err error) {
	isError := false
	if err != nil {
		log.Printf("sending error: %s", err)
		isError = true
	}
	encoded, _ := msgpack.Marshal(OutMessage{
		Type:  messageType,
		Data:  data,
		Error: isError,
	})
	h.Out <- &Packet{Id: id, Message: encoded}
}
